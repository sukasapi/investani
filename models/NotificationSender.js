import mongoose from 'mongoose';

const Schema = mongoose.Schema;

let NotificationSenderSchema = mongoose.Schema({
    status: {
        type: String
    },
    sender: {
        type: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    notification_object: {
        type: { type: Schema.Types.ObjectId, ref: 'NotificationObject' }
    }
},
{
    timestamps: true
});

export const NotificationSender = mongoose.model('NotificationSender', NotificationSenderSchema);