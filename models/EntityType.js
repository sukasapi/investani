import mongoose from 'mongoose';

let EntityTypeSchema = mongoose.Schema({
    description: {
        type: String
    },
    url: {
        type: String
    }
});

export const EntityType = mongoose.model('Entity_type', EntityTypeSchema);