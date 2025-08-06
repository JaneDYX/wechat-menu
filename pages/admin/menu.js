// pages/menu/menu.js
const app = getApp();
const AV = app.AV;

Page({
  data: {
    menuList: [],          // 全部菜品
    categories: [],        // [{ name, chars: [] }, ...]
    selectedCategory: '',  // 当前选中的分类名称
    filteredList: []       // 根据分类过滤后的菜品
  },

  onLoad() {
    console.log('admin/menu onLoad，AV=', AV);
    const Dish = AV.Object.extend('Dish');
    const query = new AV.Query(Dish);
    query.find()
      .then(dishes => {
        console.log('拉到的 dishes：', dishes);
        const menuList = dishes.map(obj => ({
          id: obj.id,
          name: obj.get('name'),
          image: obj.get('image') ? obj.get('image').url() : '/images/recipes/default.png',
          categories: obj.get('categories') || [],
          summary: (obj.get('ingredients') || []).map(i => i.name).join('，'),
          ingredients: obj.get('ingredients') || []
        }));

        const uniqueCats = Array.from(new Set(menuList.flatMap(d => d.categories)));
        const categories = uniqueCats.map(name => ({ name, chars: name.split('') }));
        const selectedCategory = categories[0]?.name || '';
        const filteredList = menuList.filter(d => d.categories.includes(selectedCategory));

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
      filteredList: this.data.menuList.filter(d => d.categories.includes(cat))
    });
  },

  // 添加到“今日”（示例：存本地）
  addToToday(e) {
    const id = e.currentTarget.dataset.id;
    const today = wx.getStorageSync('TODAY_MENU') || [];
    if (today.find(d => d.id === id)) {
      return wx.showToast({ title: '已在今日菜单', icon: 'none' });
    }
    const dish = this.data.menuList.find(d => d.id === id);
    today.push(dish);
    wx.setStorageSync('TODAY_MENU', today);
    wx.showToast({ title: '已添加到今日', icon: 'success' });
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/admin/edit?id=${id}`
    });
  },

  goAddDish() {
    wx.navigateTo({
      url: '/pages/admin/addDish'
    });
  }
});
