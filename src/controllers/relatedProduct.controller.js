import { getRelatedProducts } from "../db/relatedProductDb.js";

const getRelatedProductsController = async (req, res) => {
  try {
    const productId = req.params.id;

    const related = await getRelatedProducts(productId);

    res.json(related);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export default {
  getRelatedProducts: getRelatedProductsController
};
