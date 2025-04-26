
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  category: { type: String, required: true },
  isNew: { type: Boolean, default: false },
  isOnSale: { type: Boolean, default: false },
  salePrice: { type: Number },
  stock: { type: Number, default: 0 },
  sizes: { type: String }
});

export default mongoose.model('Product', productSchema);
