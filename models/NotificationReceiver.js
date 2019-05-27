import mongoose from 'mongoose';
import { stat } from 'fs';

const Schema = mongoose.Schema;

let NotificationReceiverSchema = mongoose.Schema({
    status: {
        type: String
    },
    receiver: {
        type: Schema.Types.ObjectId, ref: 'User'
    },
    notification_object: {
        type: Schema.Types.ObjectId, ref: 'Notification_object'
    }
},
{
    timestamps: true
});

export const NotificationReceiver = mongoose.model('Notification_receiver', NotificationReceiverSchema);
export const getNotificationReceiverByReceiverAndStatus = (receiver, status, callback) => {
    NotificationReceiver.find({
        status: status,
        receiver: receiver
    }, callback).populate({
        path: 'notification_object',
        populate: [{ path: 'entity_type' }, { path: 'entity' }]
    }).distinct('notification_object._id');
}
export const deleteNotificationReceiverByEntityType = (entityType, callback) => {
    NotificationReceiver.deleteMany({
        'notification_object.entity_type._id': entityType
    }, callback).populate({
        path: 'notification_object',
        populate: [{ path: 'entity_type' }, { path: 'entity' }]
    })
}