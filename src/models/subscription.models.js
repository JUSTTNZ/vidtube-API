import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema (
    {
        subscriber: {
            type: Schema.Types.ObjectId, // one who is SUBSCRIBING
            ref: "User",
        },
        channel: {
            type: Schema.Types.ObjectId, // one to whom subscriber is subscribing
            ref: "User"
        },
        subscriberCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema)