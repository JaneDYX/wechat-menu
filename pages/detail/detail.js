// pages/detail/detail.js
const app = getApp();
const AV = app.AV;

Page({
  data: {
    id: '',
    name: '',
    imageUrl: '/images/recipes/upload.png',
    categories: [],
    summary: '',
    ingredients: []
  },

  onLoad(options) {
    const id = options.id;
    this.setData({ id });
    wx.showLoading({ title: '加载中...' });

    const Dish = AV.Object.extend('Dish');
    const query = new AV.Query(Dish);
    query.get(id)
      .then(obj => {
        // 取字段
        const name = obj.get('name');
        const file = obj.get('image');
        const imageUrl = file ? file.url() : '/images/recipes/default.png';
        const categories = obj.get('categories') || [];
        const summary = obj.get('summary') || '';
        const ingredients = obj.get('ingredients') || [];

        this.setData({
          name,
          imageUrl,
          categories,
          summary,
          ingredients
        });
      })
      .catch(err => {
        console.error('加载详情失败', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      })
      .finally(() => {
        wx.hideLoading();
      });
  }
});
