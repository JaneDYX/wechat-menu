// pages/today/today.js
const app = getApp();
const AV  = app.AV;

Page({
  data: {
    breakfastList: [],
    lunchList:     [],
    dinnerList:    [],
    totalPrice:    0,
    totalPriceStr: '0.00', 
    dragEnabled:   false
  },

  onLoad() {
    // 获取窗口宽度，计算拖拽项宽度
    wx.getWindowInfo({
      success: res => {
        const winW = res.windowWidth;
        this.itemWidthPx = winW * (140 / 750);
      },
      fail: () => {
        this.itemWidthPx = 375 * (140 / 750);
      }
    });
    this.loadToday();
  },

  onShow() {
    this.loadToday();
  },

  onReady() {
    // 缓存各餐区位置
    wx.createSelectorQuery().in(this)
      .select('#breakfastArea').boundingClientRect()
      .select('#lunchArea').boundingClientRect()
      .select('#dinnerArea').boundingClientRect()
      .exec(res => {
        const [bf, ln, dn] = res;
        if (bf && ln && dn) {
          this.areaRects = { breakfast: bf, lunch: ln, dinner: dn };
        }
      });
  },

  _getStartOfDay() {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  },
  _getEndOfDay() {
    const d = new Date(); d.setHours(24,0,0,0); return d;
  },

  loadToday() {
    const Today = AV.Object.extend('Today');
    const q     = new AV.Query(Today);
    const me    = AV.User.current();
    const start = this._getStartOfDay();
    const end   = this._getEndOfDay();

    q.equalTo('owner', me)
     .greaterThanOrEqualTo('date', start)
     .lessThan('date', end)
     .include('dish')
     .ascending('meal,order')
     .find()
     .then(results => {
       const bf = [], ln = [], dn = [];
       let totalPrice = 0;

       results.forEach(obj => {
         const dish = obj.get('dish');
         const ing  = dish.get('ingredients') || [];

         // 计算单品总价
         const tot = ing.reduce((sum, it) => {
           const p = parseFloat(it.unitPrice) || 0;
           const a = parseFloat(it.amount)    || 0;
           return sum + p * a;
         }, 0);
         totalPrice += tot;

         const rec = {
           historyId: obj.id,
           id:        dish.id,
           name:      dish.get('name'),
           image:     dish.get('image') ? dish.get('image').url() : '/images/recipes/default.png',
           summary:   dish.get('summary'),
           total:     tot,
           totalStr:  tot.toFixed(2),   // ← 预格式化字符串
           ingredients: ing
         };

         switch(obj.get('meal')) {
           case 'breakfast': bf.push(rec); break;
           case 'lunch':     ln.push(rec); break;
           case 'dinner':    dn.push(rec); break;
         }
       });

       this.setData({
         breakfastList: bf,
         lunchList:     ln,
         dinnerList:    dn,
         totalPriceStr: totalPrice.toFixed(2) 
       });

       // 保存/更新 DailySummary
       const Summary = AV.Object.extend('DailySummary');
       const q2 = new AV.Query(Summary);
       q2.equalTo('date', start)
         .equalTo('owner', me)
         .first()
         .then(existing => {
           if (existing) {
             existing.set('totalCost', totalPrice);
             return existing.save();
           } else {
             const s = new Summary();
             s.set('date', start);
             s.set('owner', me);
             s.set('totalCost', totalPrice);
             return s.save();
           }
         })
         .catch(console.error);
     })
     .catch(err => {
       console.error('loadToday 失败', err);
       wx.showToast({ title: '加载今日菜单失败', icon: 'none' });
     });
  },

  // onLongPress() {
  //   this.setData({ dragEnabled: true });
  // },

  // onDragEnd(e) {
  //   if (!this.areaRects) {
  //     this.setData({ dragEnabled: false });
  //     return;
  //   }

  //   const historyId = e.currentTarget.dataset.historyId;
  //   const fromMeal  = e.currentTarget.dataset.meal;
  //   const { pageX, pageY } = e.changedTouches[0];
  //   let newMeal = fromMeal;
  //   const { breakfast, lunch, dinner } = this.areaRects;

  //   if (pageY >= breakfast.top && pageY <= breakfast.bottom)      newMeal = 'breakfast';
  //   else if (pageY >= lunch.top     && pageY <= lunch.bottom)    newMeal = 'lunch';
  //   else if (pageY >= dinner.top    && pageY <= dinner.bottom)   newMeal = 'dinner';

  //   const mapName = { breakfast:'breakfastList', lunch:'lunchList', dinner:'dinnerList' };
  //   const listArr = this.data[ mapName[newMeal] ];
  //   const offsetX = pageX - this.areaRects[newMeal].left;
  //   const newIndex = Math.min(
  //     listArr.length-1,
  //     Math.max(0, Math.round(offsetX / this.itemWidthPx))
  //   );

  //   this._moveItemInData(historyId, fromMeal, newMeal, newIndex);

  //   const Today = AV.Object.extend('Today');
  //   const obj   = AV.Object.createWithoutData('Today', historyId);
  //   obj.set('meal',  newMeal);
  //   obj.set('order', newIndex);
  //   obj.save().catch(console.error);

  //   this.setData({ dragEnabled: false });
  // },

  // _moveItemInData(id, fromMeal, toMeal, toIndex) {
  //   const map   = { breakfast:'breakfastList', lunch:'lunchList', dinner:'dinnerList' };
  //   const fromA = [...this.data[ map[fromMeal] ]];
  //   const toA   = [...this.data[ map[toMeal]   ]];
  //   const idx   = fromA.findIndex(i => i.historyId === id);
  //   const [itm] = fromA.splice(idx, 1);
  //   toA.splice(toIndex, 0, itm);
  //   this.setData({
  //     [map[fromMeal]]: fromA,
  //     [map[toMeal]]:   toA
  //   });
  // }

  onDeleteMeal(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除确认',
      content: '确定要从今日菜单中删除这道菜吗？',
      success: res => {
        if (res.confirm) {
          const Today = AV.Object.createWithoutData('Today', id);
          Today.destroy()
            .then(() => {
              wx.showToast({ title: '删除成功' });
              this.loadToday(); // 重新加载
            })
            .catch(err => {
              console.error('删除失败', err);
              wx.showToast({ title: '删除失败', icon: 'none' });
            });
        }
      }
    });
  },
  onEditMeal(e) {
    const id = e.currentTarget.dataset.id;
    wx.showActionSheet({
      itemList: ['早餐', '午餐', '晚餐'],
      success: res => {
        const mealMap = ['breakfast', 'lunch', 'dinner'];
        const selectedMeal = mealMap[res.tapIndex];
  
        const Today = AV.Object.createWithoutData('Today', id);
        Today.set('meal', selectedMeal);
        Today.save()
          .then(() => {
            wx.showToast({ title: '修改成功' });
            this.loadToday();
          })
          .catch(err => {
            console.error('修改失败', err);
            wx.showToast({ title: '修改失败', icon: 'none' });
          });
      }
    });
  }
    
});
