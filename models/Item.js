import mongoose from 'mongoose';

// Define collection and schema for Items
let ItemSchema = mongoose.Schema({
  item: {
    type: String
  }
});

// Export Item model
export const Item = mongoose.model('Item', ItemSchema);
export const CreateUser = (newItem, callback) => {
  newItem.save(callback);
}