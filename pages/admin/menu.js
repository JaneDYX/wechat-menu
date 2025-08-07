// pages/menu/menu.js
const app = getApp();
const AV  = app.AV;

Page({
  data: {
    menuList: [],          // 全部菜品
    categories: [],        // [{ name, chars: [] }, ...]
    selectedCategory: '',  // 当前选中的分类名称
    filteredList: []       // 根据分类过滤后的菜品
  },

  onLoad() {
    this.loadMenu();
  },
  onShow() {
    // 如果你希望每次切到这个页面都刷新列表，可在这里再调一次
    this.loadMenu();
  },

  // 拉取所有菜品
  loadMenu() {
    const Dish  = AV.Object.extend('Dish');
    const query = new AV.Query(Dish);
    query.find()
      .then(dishes => {
        const menuList = dishes.map(obj => ({
          id:         obj.id,
          name:       obj.get('name'),
          image:      obj.get('image') ? obj.get('image').url() : '/images/recipes/default.png',
          categories: obj.get('categories') || [],
          summary:    (obj.get('ingredients') || []).map(i => i.name).join('，'),
          ingredients: obj.get('ingredients') || []
        }));

        const uniqueCats     = Array.from(new Set(menuList.flatMap(d => d.categories)));
        const categories     = uniqueCats.map(name => ({ name, chars: name.split('') }));
        const selectedCategory = categories[0]?.name || '';
        const filteredList   = menuList.filter(d => d.categories.includes(selectedCategory));

        this.setData({ menuList, categories, selectedCategory, filteredList });
      })
      .catch(err => {
        console.error('LeanCloud 拉取失败：', err);
        wx.showToast({ title: '加载菜单失败', icon: 'none' });
      });
  },

  // 切换分类：更改 selectedCategory 并重新过滤列表
  onSelectCategory(e) {
    const cat = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: cat,
      filteredList:     this.data.menuList.filter(d => d.categories.includes(cat))
    });
  },

  deleteDish(e) {
    const dishId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后该菜品以及今日菜单中的相关记录将同时移除，确认吗？',
      success: res => {
        if (!res.confirm) return;

        const Dish = AV.Object.createWithoutData('Dish', dishId);
        // 1. 删除 Dish 本身
        Dish.destroy()
          .then(() => {
            // 2. 删除 Today 表中所有关联记录
            const Today = AV.Object.extend('Today');
            const q = new AV.Query(Today);
            q.equalTo('dish', AV.Object.createWithoutData('Dish', dishId));
            return q.find().then(list =>
              Promise.all(list.map(rec => rec.destroy()))
            );
          })
          .then(() => {
            wx.showToast({ title: '删除成功', icon: 'success' });
            // 3. 重新加载列表
            this.loadMenu();
          })
          .catch(err => {
            console.error('删除失败', err);
            wx.showToast({ title: '删除失败，请重试', icon: 'none' });
          });
      }
    });
  },


  // 跳到编辑页
  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/admin/edit?id=${id}` });
  },

  // 跳到新增页
  goAddDish() {
    wx.navigateTo({ url: '/pages/admin/addDish' });
  }
});
