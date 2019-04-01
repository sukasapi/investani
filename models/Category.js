import mongoose from 'mongoose';

const Schema = mongoose.Schema;

let CategorySchema = mongoose.Schema({
    name: {
        type: String
    },
    description: {
        type: String
    }
},
{
    timestamps: true
});

export const Category = mongoose.model('Category', CategorySchema);

export const createCategory = (newCategory, callback) => {
    newCategory.save(callback);
}