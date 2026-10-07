---

# MERN Backend Practice Sheet
## Batch 3 — Questions 11 to 20

---

# Question 11 — Cancel a Hotel Reservation

## Problem Statement

You are building a hotel booking backend.

A logged-in user can cancel their own reservation, but only if:

- The reservation belongs to them.
- The reservation is currently `confirmed`.
- The check-in time is more than 24 hours away.

When a reservation is cancelled:

```text
Reservation.status → "cancelled"
Room.availableRooms → increase by 1
```

This means the request modifies **two documents**.

---

## Models

Reservation:

```js
{
    user: ObjectId,
    room: ObjectId,
    checkIn: Date,
    status: "confirmed" | "cancelled" | "completed"
}
```

Room:

```js
{
    name: String,
    availableRooms: Number
}
```

---

## API

```http
POST /api/reservations/:reservationId/cancel
```

---

# Student Code Stub

```js
import mongoose from "mongoose";

import Reservation from "../models/reservation.model.js";
import Room from "../models/room.model.js";

export const cancelReservation = async (
    req,
    res
) => {
    try {

        const { reservationId } = req.params;


        // STEP 1:
        // Validate reservationId


        // STEP 2:
        // Find reservation


        // STEP 3:
        // Handle reservation not found


        // STEP 4:
        // Check ownership


        // STEP 5:
        // Make sure reservation is confirmed


        // STEP 6:
        // Calculate how much time remains
        // before check-in


        // STEP 7:
        // Reject cancellation if less than
        // or equal to 24 hours remain


        // STEP 8:
        // Find the room


        // STEP 9:
        // Mark reservation cancelled


        // STEP 10:
        // Increase room availability


        // STEP 11:
        // Save both documents


        // STEP 12:
        // Return response


    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import mongoose from "mongoose";

import Reservation from "../models/reservation.model.js";
import Room from "../models/room.model.js";

export const cancelReservation = async (
    req,
    res
) => {
    try {

        const { reservationId } = req.params;

        if (
            !mongoose.isValidObjectId(
                reservationId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid reservation id"
            });
        }

        const reservation =
            await Reservation.findById(
                reservationId
            );

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found"
            });
        }

        if (
            !reservation.user.equals(
                req.user._id
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You cannot cancel this reservation"
            });
        }

        if (
            reservation.status !== "confirmed"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only confirmed reservations can be cancelled"
            });
        }

        const now = new Date();

        const millisecondsRemaining =
            reservation.checkIn.getTime() -
            now.getTime();

        const hoursRemaining =
            millisecondsRemaining /
            (1000 * 60 * 60);

        if (hoursRemaining <= 24) {
            return res.status(400).json({
                success: false,
                message:
                    "Reservations cannot be cancelled within 24 hours of check-in"
            });
        }

        const room =
            await Room.findById(
                reservation.room
            );

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        reservation.status =
            "cancelled";

        room.availableRooms += 1;

        await reservation.save();
        await room.save();

        return res.status(200).json({
            success: true,
            message:
                "Reservation cancelled successfully"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
```

---

# Solution Approach

The important part is that cancellation depends on the **current state**.

```text
Reservation exists?
      ↓
Does it belong to me?
      ↓
Is it confirmed?
      ↓
Is check-in > 24 hours away?
      ↓
Cancel
      ↓
Restore room availability
```

---

## Date Arithmetic

Both dates can be converted into milliseconds:

```js
reservation.checkIn.getTime()
```

and:

```js
new Date().getTime()
```

Subtracting them gives:

```text
milliseconds remaining
```

Then:

```js
1000 * 60 * 60
```

represents one hour:

```text
1000 ms = 1 second
60 seconds = 1 minute
60 minutes = 1 hour
```

So:

```js
millisecondsRemaining /
(1000 * 60 * 60)
```

gives hours.

---

## Why update the room too?

Imagine:

```text
availableRooms = 0
```

Someone cancels.

If you only change:

```js
reservation.status = "cancelled"
```

but forget room inventory, the system still thinks no rooms are available.

This is a classic example of **related state**.

---

## Test Cases

```text
Valid cancellation
→ 200
→ reservation cancelled
→ availableRooms + 1

Invalid reservation ID
→ 400

Reservation doesn't exist
→ 404

Someone else's reservation
→ 403

Already cancelled
→ 400

Completed reservation
→ 400

Check-in in 10 hours
→ 400
```

---

# Question 12 — Submit or Resubmit an Assignment

## Problem Statement

You are building a classroom platform.

Students can submit assignments before the deadline.

Rules:

- Assignment must exist.
- Deadline must not have passed.
- First submission creates a Submission document.
- A second submission before the deadline updates the existing one.
- One student must never have multiple submission documents for the same assignment.

---

## Models

Assignment:

```js
{
    title: String,
    deadline: Date
}
```

Submission:

```js
{
    assignment: ObjectId,
    student: ObjectId,
    submissionUrl: String,
    submittedAt: Date
}
```

---

## API

```http
PUT /api/assignments/:assignmentId/submission
```

Request:

```json
{
    "submissionUrl":
        "https://github.com/student/project"
}
```

---

# Student Code Stub

```js
import mongoose from "mongoose";

import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";

export const submitAssignment = async (
    req,
    res
) => {
    try {

        const { assignmentId } = req.params;
        const { submissionUrl } = req.body;


        // Validate assignmentId


        // Validate submissionUrl


        // Find assignment


        // Check deadline


        // Find an existing submission
        // for this student and assignment


        if (/* submission exists */) {

            // Update URL

            // Update submittedAt

            // Save

            // Return 200

        } else {

            // Create submission

            // Return 201

        }


    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import mongoose from "mongoose";

import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";

export const submitAssignment = async (
    req,
    res
) => {
    try {

        const { assignmentId } = req.params;
        const { submissionUrl } = req.body;

        if (
            !mongoose.isValidObjectId(
                assignmentId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid assignment id"
            });
        }

        if (!submissionUrl?.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Submission URL is required"
            });
        }

        const assignment =
            await Assignment.findById(
                assignmentId
            );

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        if (
            new Date() >
            assignment.deadline
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Assignment deadline has passed"
            });
        }

        const existingSubmission =
            await Submission.findOne({
                assignment:
                    assignment._id,

                student:
                    req.user._id
            });

        if (existingSubmission) {

            existingSubmission.submissionUrl =
                submissionUrl.trim();

            existingSubmission.submittedAt =
                new Date();

            await existingSubmission.save();

            return res.status(200).json({
                success: true,
                message:
                    "Submission updated successfully",
                submission:
                    existingSubmission
            });
        }

        const submission =
            await Submission.create({
                assignment:
                    assignment._id,

                student:
                    req.user._id,

                submissionUrl:
                    submissionUrl.trim(),

                submittedAt:
                    new Date()
            });

        return res.status(201).json({
            success: true,
            message:
                "Assignment submitted successfully",
            submission
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
```

---

# Why `findOne()`?

The question is:

> Does this particular student already have a submission for this particular assignment?

That translates naturally into:

```js
Submission.findOne({
    assignment: assignmentId,
    student: req.user._id
});
```

Two fields together identify the logical relationship.

---

## Why `PUT`?

This endpoint behaves like:

> Set my submission for this assignment to this value.

Calling it again changes the same logical resource rather than creating another one.

---

## Common Mistake

Bad:

```js
Submission.create(...)
```

every time.

Student clicking "Submit" five times would generate five submission records.

Not ideal unless the assignment is called "Database Pollution 101."

---

# Question 13 — Accept or Decline a Project Invitation

## Problem Statement

Users can invite other users to collaborate on a project.

An invitation has:

```js
{
    project: ObjectId,
    invitedUser: ObjectId,
    status:
        "pending" |
        "accepted" |
        "declined"
}
```

Project:

```js
{
    members: [ObjectId]
}
```

The invited user can either:

```text
accept
or
decline
```

Only the invited user may respond.

A processed invitation cannot be processed again.

---

## API

```http
POST /api/invitations/:invitationId/respond
```

Body:

```json
{
    "action": "accept"
}
```

or:

```json
{
    "action": "decline"
}
```

---

# Student Stub

```js
import mongoose from "mongoose";

import Invitation from "../models/invitation.model.js";
import Project from "../models/project.model.js";

export const respondToInvitation = async (
    req,
    res
) => {
    try {

        const { invitationId } = req.params;
        const { action } = req.body;


        // Validate invitationId


        // Validate action


        // Find invitation


        // Check invited user


        // Ensure status is still pending


        if (action === "accept") {

            // Find project

            // Add user only if not already a member

            // Save project

            // Mark invitation accepted

        } else {

            // Mark invitation declined

        }


        // Save invitation

        // Return response


    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import mongoose from "mongoose";

import Invitation from "../models/invitation.model.js";
import Project from "../models/project.model.js";

export const respondToInvitation = async (
    req,
    res
) => {
    try {

        const { invitationId } = req.params;
        const { action } = req.body;

        if (
            !mongoose.isValidObjectId(
                invitationId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid invitation id"
            });
        }

        if (
            ![
                "accept",
                "decline"
            ].includes(action)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid action"
            });
        }

        const invitation =
            await Invitation.findById(
                invitationId
            );

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found"
            });
        }

        if (
            !invitation.invitedUser.equals(
                req.user._id
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "This invitation does not belong to you"
            });
        }

        if (
            invitation.status !== "pending"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invitation has already been processed"
            });
        }

        if (action === "accept") {

            const project =
                await Project.findById(
                    invitation.project
                );

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found"
                });
            }

            const alreadyMember =
                project.members.some(
                    id =>
                        id.equals(
                            req.user._id
                        )
                );

            if (!alreadyMember) {
                project.members.push(
                    req.user._id
                );

                await project.save();
            }

            invitation.status =
                "accepted";

        } else {

            invitation.status =
                "declined";
        }

        await invitation.save();

        return res.status(200).json({
            success: true,
            status:
                invitation.status,
            message:
                `Invitation ${invitation.status}`
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
```

---

# Important Concept — State Transition

Invitation has a state:

```text
pending
```

and may transition to:

```text
accepted
```

or:

```text
declined
```

But this should not be allowed:

```text
accepted
→ declined
→ accepted
→ declined
```

unless the product explicitly wants that.

Hence:

```js
if (
    invitation.status !== "pending"
)
```

locks processed invitations.

---

# Question 14 — Report a Post

## Problem Statement

Users can report inappropriate posts.

Reasons allowed:

```text
spam
harassment
misinformation
other
```

A user must not be able to report the same post multiple times.

---

## Report Model

```js
{
    post: ObjectId,
    reportedBy: ObjectId,
    reason: String,
    details: String,
    status: "pending"
}
```

---

## API

```http
POST /api/posts/:postId/report
```

---

# Student Stub

```js
import mongoose from "mongoose";

import Post from "../models/post.model.js";
import Report from "../models/report.model.js";

export const reportPost = async (
    req,
    res
) => {
    try {

        const { postId } = req.params;

        const {
            reason,
            details
        } = req.body;


        // Validate postId


        // Validate reason


        // Find post


        // Check whether same user
        // already reported this post


        // If duplicate → 409


        // Create report


        // Return 201


    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import mongoose from "mongoose";

import Post from "../models/post.model.js";
import Report from "../models/report.model.js";

export const reportPost = async (
    req,
    res
) => {
    try {

        const { postId } = req.params;

        const {
            reason,
            details
        } = req.body;

        if (
            !mongoose.isValidObjectId(postId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid post id"
            });
        }

        const allowedReasons = [
            "spam",
            "harassment",
            "misinformation",
            "other"
        ];

        if (
            !allowedReasons.includes(reason)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid report reason"
            });
        }

        const post =
            await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        const existingReport =
            await Report.findOne({
                post: post._id,
                reportedBy:
                    req.user._id
            });

        if (existingReport) {
            return res.status(409).json({
                success: false,
                message:
                    "You have already reported this post"
            });
        }

        const report =
            await Report.create({
                post: post._id,

                reportedBy:
                    req.user._id,

                reason,

                details:
                    details?.trim() || "",

                status: "pending"
            });

        return res.status(201).json({
            success: true,
            message:
                "Post reported successfully",
            report
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
```

---

# Why `409` for duplicate report?

The request itself is valid.

But the requested resource conflicts with an already-existing relationship:

```text
same user
+
same post
+
already reported
```

So:

```http
409 Conflict
```

is meaningful.

---

# Question 15 — Moderate a Report

## Problem Statement

Moderators review user reports.

A pending report can be resolved in one of two ways:

```text
dismiss
remove_post
```

If dismissed:

```text
Report.status = "dismissed"
```

If moderator chooses `remove_post`:

```text
Post.isRemoved = true
Report.status = "resolved"
```

A report that is no longer pending cannot be processed again.

Assume authentication has already created:

```js
req.user
```

---

## API

```http
PATCH /api/reports/:reportId/moderate
```

Body:

```json
{
    "action": "remove_post"
}
```

---

# Student Stub

```js
import mongoose from "mongoose";

import Report from "../models/report.model.js";
import Post from "../models/post.model.js";

export const moderateReport = async (
    req,
    res
) => {
    try {

        // Validate moderator role

        // Validate reportId

        // Validate action

        // Find report

        // Ensure report is pending


        if (/* dismiss */) {

            // Mark dismissed

        } else {

            // Find post

            // Mark post removed

            // Save post

            // Mark report resolved

        }


        // Save report

        // Return response

    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import mongoose from "mongoose";

import Report from "../models/report.model.js";
import Post from "../models/post.model.js";

export const moderateReport = async (
    req,
    res
) => {
    try {

        const { reportId } = req.params;
        const { action } = req.body;

        const allowedRoles = [
            "moderator",
            "admin"
        ];

        if (
            !allowedRoles.includes(
                req.user.role
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Moderator access required"
            });
        }

        if (
            !mongoose.isValidObjectId(
                reportId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid report id"
            });
        }

        if (
            ![
                "dismiss",
                "remove_post"
            ].includes(action)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid action"
            });
        }

        const report =
            await Report.findById(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        if (
            report.status !== "pending"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Report has already been processed"
            });
        }

        if (action === "dismiss") {

            report.status =
                "dismissed";

        } else {

            const post =
                await Post.findById(
                    report.post
                );

            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found"
                });
            }

            post.isRemoved = true;

            await post.save();

            report.status =
                "resolved";
        }

        report.reviewedBy =
            req.user._id;

        await report.save();

        return res.status(200).json({
            success: true,
            message:
                "Report processed successfully",
            report
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message:
                "Internal server error"
        });
    }
};
```

---

# What This Question Teaches

This controller combines:

```text
Role authorization
+
State transition
+
Multi-model update
+
Server-controlled audit information
```

Notice:

```js
report.reviewedBy =
    req.user._id;
```

The moderator ID comes from authentication.

Never ask the frontend:

```json
{
    "reviewedBy": "trust-me-bro"
}
```

---

# Question 16 — Restock Inventory

## Problem Statement

Warehouse employees can restock products.

Instead of manually reading the current stock, adding quantity, and saving, use MongoDB's atomic increment operator.

---

## API

```http
POST /api/inventory/:productId/restock
```

Request:

```json
{
    "quantity": 25
}
```

Allowed roles:

```text
warehouse
admin
```

---

## Student Stub

```js
import mongoose from "mongoose";

import Product from "../models/product.model.js";
import InventoryLog from "../models/inventoryLog.model.js";

export const restockProduct = async (
    req,
    res
) => {
    try {

        // Validate role

        // Validate productId

        // Validate quantity


        // Increase stock using $inc


        // Handle missing product


        // Create inventory log


        // Return updated product

    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import mongoose from "mongoose";

import Product from "../models/product.model.js";
import InventoryLog from "../models/inventoryLog.model.js";

export const restockProduct = async (
    req,
    res
) => {
    try {

        const { productId } = req.params;
        const { quantity } = req.body;

        if (
            ![
                "warehouse",
                "admin"
            ].includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Inventory access required"
            });
        }

        if (
            !mongoose.isValidObjectId(
                productId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product id"
            });
        }

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be a positive integer"
            });
        }

        const product =
            await Product.findByIdAndUpdate(
                productId,

                {
                    $inc: {
                        stock: quantity
                    }
                },

                {
                    new: true,
                    runValidators: true
                }
            );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        await InventoryLog.create({
            product:
                product._id,

            quantity,

            type:
                "restock",

            performedBy:
                req.user._id
        });

        return res.status(200).json({
            success: true,
            message:
                "Inventory restocked successfully",
            product
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
```

---

# `$inc` Explained

This:

```js
{
    $inc: {
        stock: 25
    }
}
```

means:

```text
Increase stock by 25
```

If stock was:

```text
100
```

MongoDB turns it into:

```text
125
```

You don't need:

```js
const product = await Product.findById(id);

product.stock =
    product.stock + quantity;

await product.save();
```

---

## Why `$inc` is useful

It expresses the intention directly to MongoDB:

> Increment this numeric field.

It's cleaner and reduces the amount of application-side work.

---

# Question 17 — Apply a Coupon to a Cart

## Problem Statement

You are building checkout preparation logic.

A user can apply a coupon to their cart.

Coupon:

```js
{
    code: String,

    discountPercent: Number,

    minimumCartValue: Number,

    expiresAt: Date,

    usageLimit: Number,

    usedBy: [ObjectId]
}
```

User:

```js
{
    cart: [
        {
            product: ObjectId,
            quantity: Number
        }
    ]
}
```

Requirements:

- Coupon must exist.
- Coupon must not be expired.
- User cannot use it twice.
- Global usage limit must not be exhausted.
- Cart must meet minimum value.
- Calculate discount.
- Return final payable amount.

For this exercise, **do not permanently mark the coupon as used yet**. Usage should happen only after an actual order is created.

---

## API

```http
POST /api/cart/apply-coupon
```

Request:

```json
{
    "code": "SAVE20"
}
```

---

# Student Stub

```js
import Coupon from "../models/coupon.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";

export const applyCoupon = async (
    req,
    res
) => {
    try {

        const { code } = req.body;


        // Validate code


        // Find coupon


        // Check expiry


        // Check user already used coupon


        // Check global usage limit


        // Load user cart


        // Calculate cart total


        // Check minimum cart value


        // Calculate discount


        // Calculate final amount


        // Return pricing breakdown


    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import Coupon from "../models/coupon.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";

export const applyCoupon = async (
    req,
    res
) => {
    try {

        const { code } = req.body;

        if (!code?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Coupon code is required"
            });
        }

        const coupon =
            await Coupon.findOne({
                code:
                    code.trim().toUpperCase()
            });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found"
            });
        }

        if (
            coupon.expiresAt <= new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "Coupon has expired"
            });
        }

        const alreadyUsed =
            coupon.usedBy.some(
                id =>
                    id.equals(
                        req.user._id
                    )
            );

        if (alreadyUsed) {
            return res.status(400).json({
                success: false,
                message:
                    "You have already used this coupon"
            });
        }

        if (
            coupon.usedBy.length >=
            coupon.usageLimit
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Coupon usage limit reached"
            });
        }

        const user =
            await User.findById(
                req.user._id
            );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.cart.length) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        let cartTotal = 0;

        for (const item of user.cart) {

            const product =
                await Product.findById(
                    item.product
                );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message:
                        "A cart product no longer exists"
                });
            }

            cartTotal +=
                product.price *
                item.quantity;
        }

        if (
            cartTotal <
            coupon.minimumCartValue
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Minimum cart value is ${coupon.minimumCartValue}`
            });
        }

        const discount =
            cartTotal *
            (coupon.discountPercent / 100);

        const finalAmount =
            cartTotal - discount;

        return res.status(200).json({
            success: true,

            pricing: {
                cartTotal,
                discountPercent:
                    coupon.discountPercent,
                discount,
                finalAmount
            }
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message:
                "Internal server error"
        });
    }
};
```

---

# Percentage Calculation

Suppose:

```text
Cart = ₹5000
Discount = 20%
```

Calculation:

```js
5000 * (20 / 100)
```

gives:

```text
1000
```

So:

```text
Final = 5000 - 1000
      = 4000
```

---

# Why `.toUpperCase()`?

If stored coupon is:

```text
SAVE20
```

these should ideally behave the same:

```text
save20
Save20
SAVE20
```

So normalize input:

```js
code.trim().toUpperCase()
```

---

# Question 18 — Move a Task Through Workflow States

## Problem Statement

You are building a project management tool.

Tasks have these statuses:

```text
todo
in_progress
review
done
```

Not every transition is allowed.

Allowed:

```text
todo → in_progress

in_progress → todo
in_progress → review

review → in_progress
review → done

done → review
```

A random jump such as:

```text
todo → done
```

must be rejected.

Only project members may update the task.

---

## API

```http
PATCH /api/tasks/:taskId/status
```

Request:

```json
{
    "status": "review"
}
```

---

# Student Stub

```js
import mongoose from "mongoose";

import Task from "../models/task.model.js";
import Project from "../models/project.model.js";

export const updateTaskStatus = async (
    req,
    res
) => {
    try {

        // Validate taskId


        // Validate requested status


        // Find task


        // Find task's project


        // Verify project membership


        // Define allowed transitions


        // Check whether requested transition
        // is allowed


        // Update task


        // Save


        // Return response

    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import mongoose from "mongoose";

import Task from "../models/task.model.js";
import Project from "../models/project.model.js";

export const updateTaskStatus = async (
    req,
    res
) => {
    try {

        const { taskId } = req.params;
        const { status } = req.body;

        if (
            !mongoose.isValidObjectId(
                taskId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid task id"
            });
        }

        const validStatuses = [
            "todo",
            "in_progress",
            "review",
            "done"
        ];

        if (
            !validStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid task status"
            });
        }

        const task =
            await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const project =
            await Project.findById(
                task.project
            );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const isMember =
            project.members.some(
                id =>
                    id.equals(
                        req.user._id
                    )
            );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not a member of this project"
            });
        }

        const allowedTransitions = {

            todo: [
                "in_progress"
            ],

            in_progress: [
                "todo",
                "review"
            ],

            review: [
                "in_progress",
                "done"
            ],

            done: [
                "review"
            ]
        };

        const allowedNextStates =
            allowedTransitions[
                task.status
            ];

        if (
            !allowedNextStates.includes(
                status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot move task from ${task.status} to ${status}`
            });
        }

        task.status = status;

        await task.save();

        return res.status(200).json({
            success: true,
            message:
                "Task status updated",
            task
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
```

---

# Transition Map Explained

This:

```js
const allowedTransitions = {
    todo: ["in_progress"],

    in_progress: [
        "todo",
        "review"
    ],

    review: [
        "in_progress",
        "done"
    ],

    done: ["review"]
};
```

is just a JavaScript object.

If current status is:

```text
review
```

then:

```js
allowedTransitions["review"]
```

returns:

```js
[
    "in_progress",
    "done"
]
```

Now:

```js
.includes(status)
```

answers whether the requested next status is valid.

This is much cleaner than a 25-line mountain of `if/else`.

---

# Question 19 — Mark All Notifications as Read

## Problem Statement

Users can have many unread notifications.

Instead of loading every notification into Node.js and looping over them, perform one MongoDB update.

Notification:

```js
{
    user: ObjectId,
    message: String,
    isRead: Boolean
}
```

---

## API

```http
PATCH /api/notifications/read-all
```

Only notifications belonging to the logged-in user should change.

---

# Student Stub

```js
import Notification
    from "../models/notification.model.js";

export const markAllNotificationsRead = async (
    req,
    res
) => {
    try {

        // Find all unread notifications
        // belonging to current user


        // Mark isRead = true
        // using one database operation


        // Return how many notifications
        // were changed


    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import Notification
    from "../models/notification.model.js";

export const markAllNotificationsRead = async (
    req,
    res
) => {
    try {

        const result =
            await Notification.updateMany(

                {
                    user:
                        req.user._id,

                    isRead: false
                },

                {
                    $set: {
                        isRead: true
                    }
                }
            );

        return res.status(200).json({
            success: true,

            message:
                "Notifications marked as read",

            updatedCount:
                result.modifiedCount
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
```

---

# `updateMany()` Explained

`findByIdAndUpdate()` updates one specific document.

But here we want:

```text
all unread notifications
belonging to current user
```

So:

```js
Notification.updateMany(
    filter,
    update
)
```

is perfect.

---

# `$set`

```js
{
    $set: {
        isRead: true
    }
}
```

means:

> Set the `isRead` field to true on every matching document.

---

# `modifiedCount`

MongoDB result contains information about the update.

```js
result.modifiedCount
```

tells us how many documents were actually changed.

Example:

```text
Unread notifications = 7
```

Response could be:

```json
{
    "updatedCount": 7
}
```

---

# Why not do this?

```js
const notifications =
    await Notification.find(...);

for (const notification of notifications) {
    notification.isRead = true;
    await notification.save();
}
```

That could generate many database writes.

`updateMany()` communicates:

> Database, please update all these records in one operation.

Much cleaner.

---

# Question 20 — Add a New Saved Address

## Problem Statement

Users can save up to **5 delivery addresses**.

Each address has:

```js
{
    label: String,
    line1: String,
    city: String,
    pincode: String,
    isDefault: Boolean
}
```

Rules:

- Maximum 5 addresses.
- First saved address automatically becomes default.
- If the new address has `makeDefault: true`, all existing addresses must become non-default.
- Only one default address may exist.

---

## API

```http
POST /api/account/addresses
```

Request:

```json
{
    "label": "Office",
    "line1": "12 Residency Road",
    "city": "Bengaluru",
    "pincode": "560025",
    "makeDefault": true
}
```

---

# Student Stub

```js
import User from "../models/user.model.js";

export const addAddress = async (
    req,
    res
) => {
    try {

        const {
            label,
            line1,
            city,
            pincode,
            makeDefault
        } = req.body;


        // Validate fields


        // Find logged-in user


        // Check 5-address limit


        // Determine whether new address
        // should become default


        // If new default:
        // remove default flag from existing ones


        // Push address


        // Save user


        // Return addresses

    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import User from "../models/user.model.js";

export const addAddress = async (
    req,
    res
) => {
    try {

        const {
            label,
            line1,
            city,
            pincode,
            makeDefault
        } = req.body;

        if (
            !label?.trim() ||
            !line1?.trim() ||
            !city?.trim() ||
            !pincode?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Complete address information is required"
            });
        }

        const user =
            await User.findById(
                req.user._id
            );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (
            user.addresses.length >= 5
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Maximum 5 addresses are allowed"
            });
        }

        const shouldBeDefault =
            user.addresses.length === 0 ||
            makeDefault === true;

        if (shouldBeDefault) {

            for (
                const address
                of user.addresses
            ) {
                address.isDefault =
                    false;
            }
        }

        user.addresses.push({

            label:
                label.trim(),

            line1:
                line1.trim(),

            city:
                city.trim(),

            pincode:
                pincode.trim(),

            isDefault:
                shouldBeDefault
        });

        await user.save();

        return res.status(201).json({
            success: true,
            message:
                "Address added successfully",
            addresses:
                user.addresses
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
```

---

# Why does the first address automatically become default?

```js
user.addresses.length === 0
```

means:

> The user currently has no saved addresses.

If we created the first address with:

```text
isDefault = false
```

the account would have no default address at all.

So:

```js
const shouldBeDefault =
    user.addresses.length === 0 ||
    makeDefault === true;
```

handles both:

```text
First address
OR
user explicitly requested default
```

---

# Why loop through existing addresses?

If new address becomes default:

```js
for (
    const address of user.addresses
) {
    address.isDefault = false;
}
```

This ensures:

```text
Home     false
Office   false
Parents  false
New      true
```

instead of:

```text
Home     true
Office   false
New      true
```

which would violate the rule:

> Exactly one default address.

---

# Why `for...of`?

We need the actual address objects because we want to mutate:

```js
address.isDefault
```

`for...of` gives us each array item directly.

---

# Batch 3 Concept Summary

These ten questions introduce several important concepts beyond straightforward CRUD:

| Concept | Questions |
|---|---|
| Time calculations | Q11 |
| Deadline validation | Q12 |
| `findOne()` with compound conditions | Q12, Q14, Q17 |
| State transitions | Q13, Q15, Q18 |
| Duplicate prevention | Q12, Q13, Q14 |
| Multi-document updates | Q11, Q13, Q15, Q16 |
| `$ne`-style conflict thinking | reinforced from Q6 |
| `$inc` | Q16 |
| Coupon validation | Q17 |
| Percentage calculations | Q17 |
| Workflow maps | Q18 |
| `updateMany()` | Q19 |
| `$set` | Q19 |
| `modifiedCount` | Q19 |
| Embedded/nested arrays | Q20 |
| `for...of` | Q17, Q20 |
| Server-controlled audit fields | Q15, Q16 |
| `409 Conflict` | Q14 |
| Ownership & authorization | throughout |

At this stage, students should begin looking at a requirement like:

> “A pending invitation may only be accepted by the invited user, and accepting should add them to the project only once.”

and mentally turn it into:

```text
req.params
    ↓
validate ObjectId
    ↓
find invitation
    ↓
404?
    ↓
compare invitedUser with req.user
    ↓
403?
    ↓
check invitation.status
    ↓
find project
    ↓
check duplicate using .some()
    ↓
.push()
    ↓
save both
    ↓
200
```

That ability to **translate English requirements into controller logic** is the actual skill the sheet is trying to build.
