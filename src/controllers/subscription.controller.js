import {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const subscriberId = req.user._id

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "invalid channelID, channel does not exist");
    }

    if(!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "invalid user, user does not exist");
    }

    // TODO: toggle subscription
    try {
        const existingSubscription = await Subscription.findOne({
            subscriber: subscriberId, 
            channel: channelId
        }).populate('channel', 'username')

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
            const newSubscription = await Subscription.create({
                channel: channelId,
                subscriber: subscriberId
            });

            await Subscription.updateMany(
                {channel: channelId},
                {$inc: {subscriberCount: 1}}
            );

            await User.findByIdAndUpdate(subscriberId, {
                $inc: {subscribedChannelCount: 1}
            })

            const populatedSubscription = await newSubscription.populate('channel', 'username').execPopulate();

            return res
                .status(200)
                .json(new ApiResponse(201, populatedSubscription, "subscribed to channel successfully"))
        }
    } catch (error) {
        throw new Error(400,"cant toggle subscription");
    }
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelID");
    }

    try {
        const subscribers = await Subscription.find({ channel: channelId })
            .populate('subscriber', 'username email');

        return res
            .status(200)
            .json(new ApiResponse(200, subscribers, "Subscribers retrieved successfully"));
    } catch (error) {
        throw new ApiError(500, "Unable to retrieve subscribers");
    }
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.user._id;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    try {
        const subscriptions = await Subscription.find({ subscriber: subscriberId })
            .populate('channel', 'username subscriberCount');

        return res
            .status(200)
            .json(new ApiResponse(200, subscriptions, "Subscribed channels retrieved successfully"));
    } catch (error) {
        throw new ApiError(500, "Unable to retrieve subscribed channels");
    }
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}