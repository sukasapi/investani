import mongoose from 'mongoose';

const Schema = mongoose.Schema;

let NotificationObjectSchema = mongoose.Schema({
    budget_id: {
        type: String
    },
    entity: {
        type: Schema.Types.ObjectId, ref: 'Entity'
    },
    entity_type: {
        type: Schema.Types.ObjectId, ref: 'Entity_type'
    }
},
{
    timestamps: true
});

export const NotificationObject = mongoose.model('Notification_object', NotificationObjectSchema);