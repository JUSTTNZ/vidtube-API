import { Router } from 'express'
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet
} from "../controllers/tweet.controller.js"

import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()
router.use(verifyJWT)

router.route("/create-tweet").post(createTweet)
router.route("/user/:userId").get(getUserTweets)
router.route("/update/:tweetId").patch(updateTweet)
router.route("/:tweetId").delete(deleteTweet)

export default router