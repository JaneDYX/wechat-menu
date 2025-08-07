# 数据库设计文档

本文档描述了小程序所使用的主要后台数据库表结构，包括各表字段、数据类型和说明，方便开发和维护。

---

## 1. Dish 表（菜品）

存放菜品的基础信息。

```markdown
| 字段名      | 类型            | 说明                                   |
| ----------- | -------------- | -------------------------------------- |
| objectId    | String         | 系统自动生成的唯一 ID                    |
| name        | String         | 菜名                                   |
| categories  | Array<String>  | 菜品分类列表，如 `["主食", "汤类"]`   |
| summary     | String         | 菜品简介                                |
| image       | File           | 菜品主图，LeanCloud File 对象           |
| createdAt   | Date           | 创建时间                                |
| updatedAt   | Date           | 最后更新时间                            |
```

---

## 2. Ingredient 表（原料定义）

存放常用原料的基本信息和参考单价。

```markdown
| 字段名     | 类型     | 说明                       |
| ---------- | -------- | -------------------------- |
| objectId   | String   | 系统自动生成的唯一 ID        |
| name       | String   | 原料名称，如 “大米”         |
| unit       | String   | 单位，如 “kg”、“个”、“g”   |
| unitPrice  | Number   | 参考单价（元/单位）         |
| createdAt  | Date     | 创建时间                   |
| updatedAt  | Date     | 最后更新时间               |
```

---

## 3. DishIngredient 表（菜品原料关联）

存储每道菜所用原料的采购与用量详情，用于成本核算。

```markdown
| 字段名          | 类型                  | 说明                                             |
| --------------- | --------------------- | ------------------------------------------------ |
| objectId        | String                | 系统自动生成的唯一 ID                              |
| dish            | Pointer → Dish        | 指向对应的菜品（Dish 表）                         |
| ingredient      | Pointer → Ingredient  | 指向原料定义（Ingredient 表）                    |
| purchaseAmount  | Number                | 采购量（按 `purchaseUnit` 单位）                  |
| purchaseUnit    | String                | 采购单位快照（来自 Ingredient.unit）             |
| purchaseCost    | Number                | 采购总价（元）                                    |
| usedAmount      | Number                | 菜里实际用量（按 `purchaseUnit` 单位）             |
| unitPrice       | Number                | 快照单价 = `purchaseCost / purchaseAmount`       |
| cost            | Number                | 本菜成本 = `unitPrice * usedAmount`              |
| order           | Number                | 显示顺序，可按自定义顺序排列                      |
| createdAt       | Date                  | 创建时间                                        |
| updatedAt       | Date                  | 最后更新时间                                    |
```

---

## 4. PriceHistory 表（原料价格历史）

记录原料单价变动的历史，用于价格趋势分析。

```markdown
| 字段名       | 类型                  | 说明                           |
| ------------ | --------------------- | ------------------------------ |
| objectId     | String                | 系统自动生成的唯一 ID            |
| ingredient   | Pointer → Ingredient  | 指向对应原料（Ingredient 表）    |
| date         | Date                  | 记录日期（建议存当天零点）       |
| unitPrice    | Number                | 当日快照单价（元/单位）         |
| createdAt    | Date                  | 创建时间                        |
| updatedAt    | Date                  | 最后更新时间                    |
```

---

## 5. Today 表（当日餐次记录）

存储用户“今日”菜单的各餐次菜品选择，支持展示和排序。

```markdown
| 字段名     | 类型              | 说明                                               |
| ---------- | ---------------- | -------------------------------------------------- |
| objectId   | String           | 系统自动生成的唯一 ID                               |
| owner      | Pointer → _User   | 所属用户                                            |
| date       | Date             | 记录日期（存当天零点）                              |
| meal       | String           | 餐次，如 `"breakfast"`、`"lunch"`、`"dinner"` |
| order      | Number           | 菜品在该餐次列表中的排序                            |
| dish       | Pointer → Dish   | 指向菜品（Dish 表）                                 |
| createdAt  | Date             | 创建时间                                           |
| updatedAt  | Date             | 最后更新时间                                       |
```

---

> **注释**：
>
> * `objectId`、`createdAt`、`updatedAt` 均由 LeanCloud 自动管理。
> * `Pointer` 用于实现跨表关联。
> * 各表中的快照字段（如 `unitPrice`、`cost`）确保历史数据不受后续更新影响。
> * 后续可根据业务需求在此基础上扩展字段或新增表。
