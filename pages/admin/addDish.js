// pages/admin/addDish.js
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

    defs: [],               // 从 Ingredient 表拉取的定义
    selectedDefName: '',    // picker 文案

    existingRows: [         // 板块一：已有原料
      { defId: '', defName: '', unitPrice: 0, usedAmount: '' }
    ],
    newRows: [              // 板块二：新原料
      { customName: '', totalPrice: '', amount: '' }
    ],

    totalCost: 0            // 实时总成本
  },

  onLoad() {
    // 拉取常用原料定义
    const Def = AV.Object.extend('Ingredient');
    new AV.Query(Def).find().then(list => {
      this.setData({
        defs: list.map(o => ({
          id: o.id,
          name: o.get('name'),
          unitPrice: o.get('unitPrice')
        }))
      });
    });
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      success: res => this.setData({ imageUrl: res.tempFilePaths[0] })
    });
  },

  // 菜名、分类、简介
  onInputName(e) {
    this.setData({ name: e.detail.value });
  },
  checkboxChange(e) {
    const vals = e.detail.value;
    this.setData({
      items: this.data.items.map(i => ({
        ...i,
        checked: vals.includes(i.value)
      }))
    });
  },
  onInputSummary(e) {
    this.setData({ summary: e.detail.value });
  },

  // 板块一：已有原料
  onSelectExisting(e) {
    const def = this.data.defs[e.detail.value];
    this.setData({ selectedDefName: def.name });
    this.setData({
      existingRows: this.data.existingRows.concat([{
        defId: def.id,
        defName: def.name,
        unitPrice: def.unitPrice,
        usedAmount: ''
      }])
    });
    this.updateTotalCost();
  },
  addExisting() {
    this.setData({
      existingRows: this.data.existingRows.concat([{
        defId: '', defName: '', unitPrice: 0, usedAmount: ''
      }])
    });
  },
  removeExisting(e) {
    const i = e.currentTarget.dataset.index;
    const rows = [...this.data.existingRows];
    rows.splice(i, 1);
    this.setData({ existingRows: rows }, this.updateTotalCost);
  },
  onInputExistingUsed(e) {
    const i = e.currentTarget.dataset.index;
    const rows = [...this.data.existingRows];
    rows[i].usedAmount = e.detail.value;
    this.setData({ existingRows: rows }, this.updateTotalCost);
  },

  // 板块二：新原料
  addNew() {
    this.setData({
      newRows: this.data.newRows.concat([{ customName: '', totalPrice: '', amount: '' }])
    });
  },
  removeNew(e) {
    const i = e.currentTarget.dataset.index;
    const rows = [...this.data.newRows];
    rows.splice(i, 1);
    this.setData({ newRows: rows }, this.updateTotalCost);
  },
  onInputNewName(e) {
    const i = e.currentTarget.dataset.index;
    const rows = [...this.data.newRows];
    rows[i].customName = e.detail.value;
    this.setData({ newRows: rows });
  },
  onInputNewCost(e) {
    const i = e.currentTarget.dataset.index;
    const rows = [...this.data.newRows];
    rows[i].totalPrice = e.detail.value;
    this.setData({ newRows: rows }, this.updateTotalCost);
  },
  onInputNewAmount(e) {
    const i = e.currentTarget.dataset.index;
    const rows = [...this.data.newRows];
    rows[i].amount = e.detail.value;
    this.setData({ newRows: rows }, this.updateTotalCost);
  },

  // 计算并更新总成本
  updateTotalCost() {
    let sum = 0;
    // 已有原料：unitPrice * usedAmount
    this.data.existingRows.forEach(r => {
      const p = parseFloat(r.unitPrice) || 0;
      const c = parseFloat(r.usedAmount) || 0;
      sum += p * c;
    });
    // 新原料：直接加 totalPrice
    this.data.newRows.forEach(r => {
      sum += parseFloat(r.totalPrice) || 0;
    });
    this.setData({ totalCost: Math.round(sum * 100) / 100 });
  },

  // 提交：检查同名、保存新原料、保存菜品
  onSubmit() {
    const {
      name,
      items,
      summary,
      imageUrl,
      existingRows,
      newRows
    } = this.data;
  
    const trimmedName = name.trim();
    if (!trimmedName) {
      wx.showToast({ title: '请先输入菜名', icon: 'none' });
      return;
    }
  
    const Dish       = AV.Object.extend('Dish');
    const Ingredient = AV.Object.extend('Ingredient');
    const dishQuery  = new AV.Query(Dish);
  
    // 1. 同名检测
    dishQuery.equalTo('name', trimmedName);
    dishQuery.first()
      .then(dishExists => {
        if (dishExists) {
          wx.showToast({ title: '该菜品已存在', icon: 'none' });
          return Promise.reject('DUPLICATE_DISH');
        }
        // 2. 保存“新原料”到 Ingredient 表
        const savePromises = newRows.map((r, idx) => {
          const name = r.customName.trim();
          if (!name) return Promise.resolve();
          const total = parseFloat(r.totalPrice) || 0;
          const amt   = parseFloat(r.amount)     || 1;
          const ing = new Ingredient();
          ing.set('name', name);
          ing.set('unitPrice', total / amt);
          return ing.save().then(saved => {
            newRows[idx].defId = saved.id;
          });
        });
        return Promise.all(savePromises);
      })
      .then(() => {
        // 3. 拼装 ingredients 数组
        const ingredients = [];
  
        // 已有原料
        existingRows.forEach(r => {
          if (r.defId) {
            ingredients.push({
              defId:     r.defId,
              name:      r.defName,
              unitPrice: r.unitPrice,
              amount:    parseFloat(r.usedAmount) || 0
            });
          }
        });
  
        // 新原料
        newRows.forEach(r => {
          if (r.customName.trim()) {
            const total = parseFloat(r.totalPrice) || 0;
            const amt   = parseFloat(r.amount)     || 1;
            ingredients.push({
              defId:     r.defId || null,
              name:      r.customName.trim(),
              unitPrice: total / amt,
              amount:    amt
            });
          }
        });
  
        // 4. 新建并保存 Dish
        const dish = new Dish();
        dish.set('name', trimmedName);
        dish.set('categories',
          items.filter(i => i.checked).map(i => i.value)
        );
        dish.set('summary', summary);
        if (imageUrl) {
          dish.set('image', AV.File.withURL('dish.jpg', imageUrl));
        }
        dish.set('ingredients', ingredients);
  
        return dish.save();
      })
      .then(() => {
        wx.showToast({ title: '保存成功' });
        wx.navigateBack();
      })
      .catch(err => {
        if (err === 'DUPLICATE_DISH') return;
        console.error(err);
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      });
  }
  
});
