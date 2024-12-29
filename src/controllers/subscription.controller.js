import {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const subscriptionId = req.user._id

    if(!isValidObjectId(channelId)) {
        throw new Error(400,"invalid channelID, channel does exist");
    }

    if(!isValidObjectId(subscriberId)) {
        throw new Error(400,"invalid user, user does not exist");
    }


    // TODO: toggle subscription
    try {
        const existingSubscription = await Subscription.findOne({
            subscriber: subscriberId, 
            channel:channelId
        }).populate('channel, username')

        if(existingSubscription) {
            await Subscription.deleteOne({
                _id: existingSubscription._id
            })

            await Subscription.updateMany(
                {channel: channelId},
                {$inc: {subscriberCount: -1}}
            )

            await User.findByIdAndUpdate(subscriberId, {
                $inc: {subscribedChannelCount: -1},
            })

            return res
                .status(200)
                .json(new ApiResponse(201, existingSubscription, "unsubscribed to channel successfully"))
        } else {
            const newSubscriber = Subscriber.create({
                channel: channelId,
                subscriber: subscriberId
            });

            await Subscriber.updateMany(
                {channel: channelId},
                {$inc: {subscriberCount +1}}
            );

            await User.findByIdAndUpdate(subscriberId, {
                {channel: channelId},
                {$inc: {subscribedChannelCount +1}}
            })

            const populatedSubscription = newSubscriber.populate('channel', 'username').execPopulate();

            return res
                .status(200)
                .json(new ApiResponse(201, populatedSubscription, "subscribed to channel successfully"))
        }
    } catch (error) {
        
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}