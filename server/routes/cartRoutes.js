const express = require("express");
const router = express.Router();
const CartController = require("../controllers/cartController");

// If you have auth middleware
// const auth = require("../middlewares/auth.middleware");

router.post("/", CartController.add);
router.put("/", CartController.update);
router.delete("/:productId", CartController.remove);
router.get("/", CartController.getCart);
router.get("/count", CartController.getCount);

module.exports = router;