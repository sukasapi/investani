import mongoose from 'mongoose';

const Schema = mongoose.Schema;

let TransactionSchema = mongoose.Schema({
    stock_quantity: {
        type: Number
    },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    investor: { type: Schema.Types.ObjectId, ref: 'User'}
}, {
    timestamps: true
});

export const Transaction = mongoose.model('Transaction', TransactionSchema);