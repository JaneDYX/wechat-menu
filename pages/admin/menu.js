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
    // 1. Mock 数据
    const mock = [
      {
        id: 1,
        name: '西红柿炒蛋',
        image: '/images/recipes/tomato-egg.jpg',
        categories: ['炒菜'],
        ingredients: [
          { name: '西红柿', weight: 200, price: 3 },
          { name: '鸡蛋', weight: 100, price: 4 }
        ]
      },
      {
        id: 2,
        name: '青椒酿肉',
        image: '/images/recipes/qingjiao.jpg',
        categories: ['荤菜'],
        ingredients: [
          { name: '青椒', weight: 200, price: 3 },
          { name: '蒜瓣', weight: 100, price: 4 }
        ]
      },
      {
        id: 3,
        name: '皮蛋瘦肉粥',
        image: '/images/recipes/porridge.jpg',
        categories: ['主食'],
        ingredients: [
          { name: '大米', weight: 100, price: 2 },
          { name: '皮蛋', weight: 50, price: 4 },
          { name: '瘦肉', weight: 80, price: 6 }
        ]
      }
    ];

    // 2. 生成 summary 字段（只显示材料名称）
    const menuList = mock.map(item => ({
      ...item,
      summary: item.ingredients.map(i => i.name).join('，')
    }));

    // 3. 提取不重复的分类，并拆分成单字数组用于竖排
    const uniqueCats = Array.from(new Set(mock.flatMap(i => i.categories)));
    const categories = uniqueCats.map(name => ({
      name,
      chars: name.split('')
    }));

    // 4. 默认选第一个分类，过滤列表
    const selectedCategory = categories[0]?.name || '';
    const filteredList = menuList.filter(d =>
      d.categories.includes(selectedCategory)
    );

    this.setData({ menuList, categories, selectedCategory, filteredList });
  },

  // 点击左侧分类，跳到相应位置并高亮
  onSelectCategory(e) {
    const cat = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: cat,
      filteredList: this.data.menuList.filter(d =>
        d.categories.includes(cat)
      )
    });
  },

  // 点击「＋」添加到今日（这里只做提示）
  addToToday(e) {
    const id = e.currentTarget.dataset.id;
    const today = wx.getStorageSync('TODAY_MENU') || [];
    // 查缓存里有没有同样 id
    if (today.find(d => d.id === id)) {
      wx.showToast({ title: '已在今日菜单，无需重复添加', icon: 'none' });
      return;
    }
    // 没有则加入
    const dish = this.data.menuList.find(d => d.id === id);
    today.push(dish);
    wx.setStorageSync('TODAY_MENU', today);
    wx.showToast({ title: '已添加到今日', icon: 'success' });
  },

  // 点击整个菜品项，进入详情页
  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/Admin/edit?id=${id}` });
  }
});
