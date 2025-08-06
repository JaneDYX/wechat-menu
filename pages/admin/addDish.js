const app = getApp();
const AV = app.AV;

Page({
  data: {
    name: '',
    items: [
      { value: '主食', checked: false },
      { value: '炒菜', checked: false },
      { value: '炖菜', checked: false },
      { value: '汤类', checked: false },
      { value: '面点', checked: false }
    ],
    summary: '',
    imageUrl: '',
    ingredients: [
      { name: '', price: '', amount: '' }
    ]
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      success: res => {
        const path = res.tempFilePaths[0];
        this.setData({ imageUrl: path });
      }
    });
  },

  onInputName(e) {
    this.setData({ name: e.detail.value });
  },
  checkboxChange(e) {
    const values = e.detail.value;           
    const items = this.data.items.map(item => ({
      ...item,
      checked: values.includes(item.value)
    }));
    this.setData({ items });
  },
  onInputSummary(e) {
    this.setData({ summary: e.detail.value });
  },

  onIngredientInput(e) {
    const { field, index } = e.currentTarget.dataset;
    const value = e.detail.value;
    const ingredients = this.data.ingredients;
    ingredients[index][field] = value;
    this.setData({ ingredients });
  },

  addIngredient() {
    const newItem = { name: '', price: '', amount: '' };
    const newList = this.data.ingredients.concat([ newItem ]);
    this.setData({ ingredients: newList });
  },

  // ➖ 删除原材料（也不用 spread，slice 返回新数组）
  removeIngredient(e) {
    const idx = e.currentTarget.dataset.index;
    const list = this.data.ingredients.slice();  
    list.splice(idx, 1);
    this.setData({ ingredients: list });
  },

  onSubmit() {
    const { name, items, summary, imageUrl, ingredients } = this.data;
    // 筛出所有 checked 的分类
    const categories = items.filter(i => i.checked).map(i => i.value);
    // 上传图片到 LeanCloud，拿到 File 对象
    const file = imageUrl
      ? AV.File.withURL('dish.jpg', imageUrl)
      : null;

    // 构造一个 Dish 对象
    const Dish = AV.Object.extend('Dish');
    const dish = new Dish();
    dish.set('name', name);
    dish.set('categories', categories);
    dish.set('summary', summary);
    if (file) dish.set('image', file);
    dish.set('ingredients', ingredients);

    // 保存到云端（在同一个 Class 里生成一条记录）
    dish.save()
      .then(() => {
        wx.showToast({ title: '保存成功' });
        wx.navigateBack();
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
  }
});
