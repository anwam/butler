require("dotenv").config();

const { Telegraf } = require("telegraf");
const {
  MenuTemplate,
  MenuMiddleware,
  createBackMainMenuButtons,
  deleteMenuFromContext,
} = require("telegraf-inline-menu");

let order = {
  person: "",
  food: "",
  extra: false,
  eggAdded: false,
  price: 0,
};

const mainMenu = new MenuTemplate(
  (ctx) => `สวัสดีครับ ${ctx.from.first_name} ต้องการสั่งอาหารร้านไหนครับ`
);

const restaurantMenu = new MenuTemplate(`กรุณาเลือกร้าน`);

const foodMenu = new MenuTemplate(`กรุณาเลือกเมนู`);
foodMenu.choose(
  "food",
  { "ผัดมาม่า:40": "ผัดมาม่า", "ผัดกะเพรา:40": "ผัดกะเพรา" },
  {
    do: async (ctx, key) => {
      order.food = key.split(":")[0];
      order.person = ctx.from.first_name;
      order.price = key.split(":")[1];
      await ctx.reply(
        `เมนูอาหารของ ${order.person} คือ ${order.food} ${
          order.extra ? "พิเศษ" : ""
        } ${order.eggAdded ? "ไข่ดาว" : ""} ราคา ${
          Number(order.price) + (order.eggAdded && 5) + (order.extra && 5)
        } บาท`
      );
      await deleteMenuFromContext(ctx);
      return false;
    },
  }
);
foodMenu.toggle("ไข่ดาว", "egg", {
  set: (_, newState) => {
    order.eggAdded = newState;
    return true;
  },
  isSet: () => order.eggAdded,
});

foodMenu.toggle("พิเศษ", "extra", {
  joinLastRow: true,
  set: (_, newState) => {
    order.extra = newState;
    return true;
  },
  isSet: () => order.extra,
});

restaurantMenu.submenu("กินอยู่ดี", "kyd", foodMenu);
mainMenu.submenu("เลือกร้าน", "restaurant", restaurantMenu);

restaurantMenu.manualRow(createBackMainMenuButtons());
foodMenu.manualRow(createBackMainMenuButtons());
const bot = new Telegraf(process.env.BOT_TOKEN);

const menuMiddleware = new MenuMiddleware("/", mainMenu);
bot.command("start", (ctx) => {
  order.person = ctx.from.first_name;
  return menuMiddleware.replyToContext(ctx);
});
bot.use(menuMiddleware);

bot.launch();
