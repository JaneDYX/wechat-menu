// pages/today/today.js
const app = getApp();
const AV = app.AV;

Page({
  data: {
    breakfastList: [],
    lunchList: [],
    dinnerList: [],
    dragEnabled: false
  },

  onLoad() {
    this.loadToday();
    // 计算每项总宽度 px（140rpx = 120rpx 宽 + 20rpx 间距）
    const winWidth = wx.getSystemInfoSync().windowWidth;
    this.itemWidthPx = winWidth * (140 / 750);
  },

  onShow() {
    this.loadToday();
  },

  onReady() {
    // 缓存各餐次区域的绝对位置（px）
    const query = wx.createSelectorQuery().in(this);
    query
      .select('#breakfastArea').boundingClientRect()
      .select('#lunchArea').boundingClientRect()
      .select('#dinnerArea').boundingClientRect()
      .exec(res => {
        // res 是一个数组，依次对应三个 select
        const [bfRect, lnRect, dnRect] = res;
        if (bfRect && lnRect && dnRect) {
          this.areaRects = {
            breakfast: bfRect,
            lunch:     lnRect,
            dinner:    dnRect
          };
        }
      });
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
         // 拿到原材料数组，用来算价钱
        const ingredients = dish.get('ingredients') || [];
        // 假定 ingredients 里每项是 { name, amount, price }，且 price/amount 可直接相乘
         const total = ingredients.reduce((sum, it) => {
         // 如果 price 或 amount 带单位，需要先 parseFloat
         const p = parseFloat(it.price);
         const a = parseFloat(it.amount);
         return sum + (isNaN(p)||isNaN(a) ? 0 : p * a);
       }, 0);
       totalPrice += total;
         const rec = {
           historyId: obj.id,
           id:        dish.id,
           name:      dish.get('name'),
           image:     dish.get('image') ? dish.get('image').url() : '/images/recipes/default.png',
           summary:   dish.get('summary'),
           total,
           ingredients
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
               totalPrice     // 今日总价
             });
     });
  },

  _getStartOfDay() {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  },
  _getEndOfDay() {
    const d = new Date(); d.setHours(24,0,0,0); return d;
  },

  onLongPress() {
    this.setData({ dragEnabled: true });
  },

  // pages/today/today.js
onDragEnd(e) {
  // 如果还没缓存到区域信息，就
  if (!this.areaRects) {
    // 直接退出拖拽模式，避免报错
    this.setData({ dragEnabled: false });
    return;
  }

  const historyId = e.currentTarget.dataset.historyId;
  const fromMeal  = e.currentTarget.dataset.meal;
  const { pageX, pageY } = e.changedTouches[0];

  // 1️. 判断落在哪个区域
  let newMeal = fromMeal;
  const { breakfast, lunch, dinner } = this.areaRects;
  if (pageY >= breakfast.top && pageY <= breakfast.bottom)      newMeal = 'breakfast';
  else if (pageY >= lunch.top     && pageY <= lunch.bottom)    newMeal = 'lunch';
  else if (pageY >= dinner.top    && pageY <= dinner.bottom)   newMeal = 'dinner';

  // 2️. 计算 newIndex
  const mapName = { breakfast: 'breakfastList', lunch: 'lunchList', dinner: 'dinnerList' };
  const listArr = this.data[ mapName[newMeal] ];
  const areaRect = this.areaRects[newMeal];
  const offsetX  = pageX - areaRect.left;
  const newIndex = Math.min(
    listArr.length - 1,
    Math.max(0, Math.round(offsetX / this.itemWidthPx))
  );

  // 3️. 更新前端并同步后端…
  this._moveItemInData(historyId, fromMeal, newMeal, newIndex);
  const Today = AV.Object.extend('Today');
  const obj   = AV.Object.createWithoutData('Today', historyId);
  obj.set('meal',  newMeal);
  obj.set('order', newIndex);
  obj.save().catch(console.error);

  // 4️. 退出拖拽模式
  this.setData({ dragEnabled: false });
},


  _moveItemInData(id, fromMeal, toMeal, toIndex) {
    const map = { breakfast: 'breakfastList', lunch: 'lunchList', dinner: 'dinnerList' };
    const fromArr = this.data[ map[fromMeal] ].slice();
    const toArr   = this.data[ map[toMeal]   ].slice();
    const idx     = fromArr.findIndex(i => i.historyId === id);
    const [item]  = fromArr.splice(idx, 1);
    toArr.splice(toIndex, 0, item);
    this.setData({
      [map[fromMeal]]: fromArr,
      [map[toMeal]]:   toArr
    });
  }
});
