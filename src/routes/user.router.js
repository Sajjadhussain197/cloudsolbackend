import { Router } from "express";
import { loggedOutUser, 
    loginUser, 
    registerUser, 
    refreshAcessToken, 
    changePassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar,
     updateUserCoverImage,
     deleteUser,
     getUserById,
     getAllUsers
    } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { isAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {name:"avatar",
            maxCount:1
        },
        {name:"coverImage",
            maxCount:1}
    ]),
    registerUser
);
router.route("/login").post(loginUser)
router.route("/delete-user/:id").delete(verifyJWT,deleteUser)
router.route("/logout").post(verifyJWT, loggedOutUser)
router.route("/refresh-token").post(refreshAcessToken)
router.route("/change-password").post(verifyJWT,changePassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("/coverImage"),updateUserCoverImage)
router.route("/getuserbyid/:id").get( getUserById);
router.route("/getallusers").get( getAllUsers);

export default router;