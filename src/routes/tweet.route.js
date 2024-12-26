import { Router } from 'express'
import {
    createdTweet,
    deleteTweet,
    getUserTweets,
    updateTweet
} from "../controllers/tweet.controller.js"

import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()
router.use(verifyJWT)

router.route("/").post(createdTweet)
router.route("/user/:userId").get(getUserTweets)
router.route("/:tweeId").patch(updateTweet)
router.route("/:tweetId").delete(deleteTweet)

export default router