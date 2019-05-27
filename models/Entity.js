import mongoose from 'mongoose';

let EntitySchema = mongoose.Schema({
    name: {
        type: String
    }
});

export const Entity = mongoose.model('Entity', EntitySchema);