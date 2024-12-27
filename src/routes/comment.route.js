import { Router } from 'express'
import {
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comments.controller.js"

import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()
router.use(verifyJWT)

router.route("/add-comment").post(addComment)
router.route("/comment/:videoId").get(getVideoComment)
router.route("/update/:CommentId").patch(updateComment)
router.route("/delete/:CommentId").delete(deleteComment)

export default router