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
    this.loadMenu();
  },

  onShow() {
    // 页面每次显示都刷新
    this.loadMenu();
  },
  loadMenu() {
    const Dish  = AV.Object.extend('Dish');
    const query = new AV.Query(Dish);
    query.find()
      .then(dishes => {
        const menuList = dishes.map(obj => ({
          id: obj.id,
          name: obj.get('name'),
          image: obj.get('image') 
            ? obj.get('image').url() 
            : '/images/recipes/default.png',
          categories: obj.get('categories') || [],
          summary: (obj.get('ingredients') || [])
            .map(i => i.name).join('，'),
          ingredients: obj.get('ingredients') || []
        }));

        // 分类逻辑同之前
        const uniqueCats      = Array.from(new Set(menuList.flatMap(d => d.categories)));
        const categories      = uniqueCats.map(name => ({ name, chars: name.split('') }));
        const selectedCategory = categories[0]?.name || '';
        const filteredList    = menuList.filter(d => d.categories.includes(selectedCategory));

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

  // 添加到“今日”
  addToToday(e) {
    const dishId = e.currentTarget.dataset.id;
  
    wx.showActionSheet({
      itemList: ['早餐', '午餐', '晚餐'],
      success: res => {
        const mealMap = ['breakfast', 'lunch', 'dinner'];
        const selectedMeal = mealMap[res.tapIndex];
  
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
  
        const Today = AV.Object.extend('Today');
        const dishPointer = AV.Object.createWithoutData('Dish', dishId);
        const currentUser = AV.User.current();
  
        const q = new AV.Query(Today);
        q.equalTo('date', todayStart);
        q.equalTo('dish', dishPointer);
        q.equalTo('meal', selectedMeal); // 👈 防止同一餐重复添加
        q.equalTo('owner', currentUser);
  
        q.first()
          .then(existing => {
            if (existing) {
              return Promise.reject('already');
            }
            const rec = new Today();
            rec.set('date', todayStart);
            rec.set('dish', dishPointer);
            rec.set('meal', selectedMeal);
            rec.set('owner', currentUser);
            return rec.save();
          })
          .then(() => {
            wx.showToast({ title: '已添加到今日', icon: 'success' });
          })
          .catch(err => {
            if (err === 'already') {
              wx.showToast({ title: '该菜已添加到该餐，无需重复添加', icon: 'none' });
            } else {
              console.error('添加到今日出错', err);
              wx.showToast({ title: '添加失败，请重试', icon: 'none' });
            }
          });
      },
      fail: () => {
        // 用户取消选择，不做任何操作
      }
    });
  },
  

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  }
});
