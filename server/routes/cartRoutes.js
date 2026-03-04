const express        = require("express");
const router         = express.Router();
const CartController = require("../controllers/cartController");
const { optionalAuth } = require("../middlewares/authMiddleware");

router.post("/",           optionalAuth, CartController.add);
router.put("/",            optionalAuth, CartController.update);
router.delete("/:productId", optionalAuth, CartController.remove);
router.get("/",            optionalAuth, CartController.getCart);
router.get("/count",       optionalAuth, CartController.getCount);

module.exports = router;
