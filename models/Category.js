import mongoose from 'mongoose';

let CategorySchema = mongoose.Schema({
    title: {
        type: String
    },
    unit: {
        type: String
    },
    description: {
        type: String
    },
    sub_category: [{
        name: {
            type: String
        }
    }]
},
{
    timestamps: true
});

export const Category = mongoose.model('Category', CategorySchema);
export const createCategory = (newCategory, callback) => {
    newCategory.save(callback);
}