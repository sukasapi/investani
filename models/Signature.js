import mongoose from 'mongoose';

let SignatureSchema = mongoose.Schema({
    full_name: {
        type: String
    },
    identity_number: {
        type: String
    },
    position: {
        type: String
    },
    signature: {
        type: String
    }
},
{
    timestamps: true
});

export const Signature = mongoose.model('Signature', SignatureSchema);
export const createSignature = (newSignature, callback) => {
    newSignature.save(callback);
}
export const getSignatureByID = (id, callback) => {
    Signature.findById(id, callback);
}