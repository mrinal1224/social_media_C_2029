---

# MERN Backend Practice Sheet
## Batch 2 — Questions 6 to 10
### Difficulty: Intermediate

---

# Question 6 — Reschedule a Doctor Appointment

## Problem Statement

You are building the backend for a healthcare appointment platform.

A patient has already booked an appointment with a doctor.

The patient should be able to change the appointment time, but only if:

- The appointment belongs to them.
- The appointment is still `scheduled`.
- The new appointment time is in the future.
- The doctor does not already have another scheduled appointment at exactly that time.

This question introduces an important backend idea:

> Updating data is sometimes not enough. Before updating, you may need to check whether the new state conflicts with existing data.

---

## Appointment Model

Assume:

```js
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        scheduledFor: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: [
                "scheduled",
                "completed",
                "cancelled"
            ],
            default: "scheduled"
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model(
    "Appointment",
    appointmentSchema
);
```

---

## API

```http
PATCH /api/appointments/:appointmentId/reschedule
```

Authenticated user:

```js
req.user._id
```

---

## Request Body

```json
{
    "scheduledFor": "2026-11-12T10:30:00.000Z"
}
```

---

## Requirements

The API must:

1. Validate `appointmentId`.
2. Validate the new date.
3. Ensure the date is in the future.
4. Find the appointment.
5. Ensure the logged-in user owns the appointment.
6. Ensure appointment status is `scheduled`.
7. Check whether the doctor already has another appointment at that time.
8. Update the appointment.

---

## Expected Success Response

```json
{
    "success": true,
    "message": "Appointment rescheduled successfully",
    "appointment": {
        "_id": "...",
        "scheduledFor": "2026-11-12T10:30:00.000Z",
        "status": "scheduled"
    }
}
```

---

# Student Code Stub

```js
import mongoose from "mongoose";
import Appointment from "../models/appointment.model.js";

export const rescheduleAppointment = async (
    req,
    res
) => {
    try {

        const { appointmentId } = req.params;
        const { scheduledFor } = req.body;


        // STEP 1:
        // Validate appointmentId


        // STEP 2:
        // Convert scheduledFor into a Date


        // STEP 3:
        // Validate the date


        // STEP 4:
        // Make sure date is in the future


        // STEP 5:
        // Find appointment


        // STEP 6:
        // Check ownership


        // STEP 7:
        // Check appointment status


        // STEP 8:
        // Check whether doctor already has
        // another appointment at this time


        // STEP 9:
        // Update scheduledFor


        // STEP 10:
        // Save appointment


        // STEP 11:
        // Return response


    } catch (error) {

        // Handle unexpected error

    }
};
```

---

# Complete Solution

```js
import mongoose from "mongoose";
import Appointment from "../models/appointment.model.js";

export const rescheduleAppointment = async (
    req,
    res
) => {
    try {

        const { appointmentId } = req.params;
        const { scheduledFor } = req.body;


        if (
            !mongoose.isValidObjectId(
                appointmentId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment id"
            });
        }


        const newAppointmentDate =
            new Date(scheduledFor);


        if (
            Number.isNaN(
                newAppointmentDate.getTime()
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid appointment date"
            });
        }


        if (
            newAppointmentDate <= new Date()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Appointment must be scheduled in the future"
            });
        }


        const appointment =
            await Appointment.findById(
                appointmentId
            );


        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }


        if (
            !appointment.patient.equals(
                req.user._id
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You cannot modify this appointment"
            });
        }


        if (
            appointment.status !== "scheduled"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only scheduled appointments can be rescheduled"
            });
        }


        const conflictingAppointment =
            await Appointment.findOne({
                doctor: appointment.doctor,

                scheduledFor:
                    newAppointmentDate,

                status: "scheduled",

                _id: {
                    $ne: appointment._id
                }
            });


        if (conflictingAppointment) {
            return res.status(409).json({
                success: false,
                message:
                    "Doctor is unavailable at this time"
            });
        }


        appointment.scheduledFor =
            newAppointmentDate;


        await appointment.save();


        return res.status(200).json({
            success: true,
            message:
                "Appointment rescheduled successfully",
            appointment
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

# Solution Approach

The complete thinking process is:

```text
Validate ID
   ↓
Validate new date
   ↓
Ensure future date
   ↓
Find appointment
   ↓
Check ownership
   ↓
Check status
   ↓
Check doctor's schedule
   ↓
Update
   ↓
Save
```

---

## Why `new Date()`?

The body contains:

```js
"2026-11-12T10:30:00.000Z"
```

That is a string.

We convert it using:

```js
const newAppointmentDate =
    new Date(scheduledFor);
```

Now JavaScript can perform proper date comparisons.

---

## Why `getTime()`?

A bad date can still produce a Date object:

```js
new Date("banana")
```

produces:

```text
Invalid Date
```

Calling:

```js
newAppointmentDate.getTime()
```

returns:

```js
NaN
```

for an invalid date.

So:

```js
Number.isNaN(
    newAppointmentDate.getTime()
)
```

allows us to detect invalid dates.

---

## Comparing Dates

```js
newAppointmentDate <= new Date()
```

means:

> Is the requested appointment time before or equal to right now?

If yes, reject it.

---

# `findOne()` — Important New Concept

We already know:

```js
findById()
```

But here we are not searching by `_id`.

We want:

> Find an appointment where doctor, date and status all match these conditions.

That is exactly what:

```js
Appointment.findOne({
    doctor: appointment.doctor,
    scheduledFor: newAppointmentDate,
    status: "scheduled"
})
```

does.

`findOne()` returns:

```text
one matching document
or
null
```

---

# What does `$ne` mean?

```js
_id: {
    $ne: appointment._id
}
```

`$ne` means:

```text
not equal
```

Why do we need this?

Imagine the patient reschedules to the same time they already have.

Without `$ne`, MongoDB may find the current appointment itself and say:

> "Conflict detected!"

But the appointment is conflicting with itself. Very impressive detective work, but not useful.

So we say:

```text
Find another appointment
whose ID is NOT this appointment's ID.
```

---

# Why `409 Conflict`?

This request is structurally valid.

The user is authorized.

The date is valid.

But the requested state conflicts with existing data.

That is exactly where:

```http
409 Conflict
```

makes sense.

---

## Common Mistakes

### Mistake 1

Updating immediately:

```js
appointment.scheduledFor =
    newAppointmentDate;
```

without checking doctor availability.

### Mistake 2

Using:

```js
appointment.patient === req.user._id
```

instead of `.equals()`.

### Mistake 3

Allowing completed appointments to be rescheduled.

Business state matters.

---

## Test Cases

```text
Valid future time
→ 200

Invalid appointment ID
→ 400

Invalid date
→ 400

Past date
→ 400

Appointment doesn't exist
→ 404

Someone else's appointment
→ 403

Completed appointment
→ 400

Cancelled appointment
→ 400

Doctor already booked
→ 409
```

---

# Question 7 — Borrow a Library Book

## Problem Statement

You are building a digital library backend.

A logged-in user can borrow books.

A book has a limited number of available physical copies.

A user:

- Cannot borrow the same book twice.
- Cannot have more than 3 books borrowed at once.
- Cannot borrow a book if no copies are available.

When a book is borrowed:

```text
Book.availableCopies decreases by 1
```

and:

```text
Book ID is added to user.borrowedBooks
```

This means one request modifies **two documents**.

---

## Book Model

```js
{
    title: String,

    availableCopies: Number
}
```

User:

```js
{
    borrowedBooks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book"
        }
    ]
}
```

---

## API

```http
POST /api/books/:bookId/borrow
```

---

# Student Code Stub

```js
import mongoose from "mongoose";

import Book from "../models/book.model.js";
import User from "../models/user.model.js";

export const borrowBook = async (
    req,
    res
) => {
    try {

        const { bookId } = req.params;
        const userId = req.user._id;


        // STEP 1:
        // Validate bookId


        // STEP 2:
        // Find user


        // STEP 3:
        // Find book


        // STEP 4:
        // Handle missing resources


        // STEP 5:
        // Check whether user already
        // borrowed this book


        // STEP 6:
        // Enforce maximum 3 borrowed books


        // STEP 7:
        // Check availableCopies


        // STEP 8:
        // Add book to borrowedBooks


        // STEP 9:
        // Decrease availableCopies


        // STEP 10:
        // Save both documents


        // STEP 11:
        // Return response


    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import mongoose from "mongoose";

import Book from "../models/book.model.js";
import User from "../models/user.model.js";

export const borrowBook = async (
    req,
    res
) => {
    try {

        const { bookId } = req.params;
        const userId = req.user._id;


        if (
            !mongoose.isValidObjectId(bookId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid book id"
            });
        }


        const user =
            await User.findById(userId);


        const book =
            await Book.findById(bookId);


        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }


        const alreadyBorrowed =
            user.borrowedBooks.some(
                id => id.equals(book._id)
            );


        if (alreadyBorrowed) {
            return res.status(400).json({
                success: false,
                message:
                    "You have already borrowed this book"
            });
        }


        if (
            user.borrowedBooks.length >= 3
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "You cannot borrow more than 3 books"
            });
        }


        if (book.availableCopies <= 0) {
            return res.status(400).json({
                success: false,
                message:
                    "No copies are currently available"
            });
        }


        user.borrowedBooks.push(
            book._id
        );


        book.availableCopies -= 1;


        await user.save();

        await book.save();


        return res.status(200).json({
            success: true,
            message:
                "Book borrowed successfully",

            availableCopies:
                book.availableCopies
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

# Solution Approach

Think of this as a series of gates:

```text
Valid book ID?
    ↓
User exists?
    ↓
Book exists?
    ↓
Already borrowed?
    ↓
Borrowing limit reached?
    ↓
Copies available?
    ↓
Update User
    ↓
Update Book
```

Only after all validations succeed do we modify anything.

---

# `.some()` Again, But Why Here?

```js
user.borrowedBooks.some(
    id => id.equals(book._id)
)
```

asks:

> Does at least one borrowed book match this book?

Returns:

```js
true
```

or:

```js
false
```

We only need existence, so `.some()` is perfect.

---

# `.length`

```js
user.borrowedBooks.length
```

gives the number of currently borrowed books.

So:

```js
user.borrowedBooks.length >= 3
```

enforces:

```text
Maximum = 3
```

---

# `-=`

```js
book.availableCopies -= 1;
```

is shorthand for:

```js
book.availableCopies =
    book.availableCopies - 1;
```

If copies were:

```text
5
```

they become:

```text
4
```

---

# Why validate everything before mutation?

Bad flow:

```js
book.availableCopies -= 1;

if (user already borrowed it) {
    return 400;
}
```

Congratulations, you rejected the request but still changed the book count in memory.

Better:

```text
validate everything
↓
then mutate
```

---

# Why two `.save()` calls?

We changed:

```js
user.borrowedBooks
```

and:

```js
book.availableCopies
```

Those belong to different MongoDB documents.

Therefore both must be persisted.

---

# Important Design Note

At much larger production scale, simultaneous borrowing requests can create concurrency problems.

That is where concepts like transactions or atomic update operators may become useful.

For this exercise, however, the goal is understanding the **business logic and multi-document flow**, not advanced concurrency control.

---

## Test Cases

```text
Valid borrow
→ 200

Invalid book ID
→ 400

Book doesn't exist
→ 404

Already borrowed same book
→ 400

Already borrowing 3 books
→ 400

availableCopies = 0
→ 400

Successful borrow:
user.borrowedBooks gets book
AND
availableCopies decreases
```

---

# Question 8 — Search Your Transactions with Filters and Pagination

## Problem Statement

You are building a finance dashboard.

A logged-in user should be able to search through their transaction history.

Supported filters:

```text
type
category
minimum amount
maximum amount
start date
end date
sorting
pagination
```

This question combines almost every important query concept into one controller.

---

## Transaction Model

```js
{
    user: ObjectId,

    title: String,

    amount: Number,

    type:
        "credit" | "debit",

    category: String,

    createdAt: Date
}
```

---

## API

```http
GET /api/transactions
```

Examples:

```http
GET /api/transactions?type=debit
```

```http
GET /api/transactions?category=food
```

```http
GET /api/transactions?minAmount=500&maxAmount=5000
```

```http
GET /api/transactions?from=2026-09-01&to=2026-09-30
```

```http
GET /api/transactions?page=2&limit=10
```

```http
GET /api/transactions?sort=amount_desc
```

Everything may be combined.

---

## Supported Sort Values

```text
newest
oldest
amount_asc
amount_desc
```

Default:

```text
newest
```

Maximum allowed limit:

```text
50
```

---

# Student Code Stub

```js
import Transaction from "../models/transaction.model.js";

export const getTransactions = async (
    req,
    res
) => {
    try {

        const {
            type,
            category,
            minAmount,
            maxAmount,
            from,
            to,
            sort
        } = req.query;


        // STEP 1:
        // Start filter with logged-in user


        // STEP 2:
        // Add type and category


        // STEP 3:
        // Build amount range


        // STEP 4:
        // Build date range


        // STEP 5:
        // Validate sort


        // STEP 6:
        // Parse page and limit


        // STEP 7:
        // Calculate skip


        // STEP 8:
        // Build sort object


        // STEP 9:
        // Query transactions


        // STEP 10:
        // Count matching transactions


        // STEP 11:
        // Return pagination information


    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import Transaction
    from "../models/transaction.model.js";

export const getTransactions = async (
    req,
    res
) => {
    try {

        const {
            type,
            category,
            minAmount,
            maxAmount,
            from,
            to,
            sort = "newest"
        } = req.query;


        const filter = {
            user: req.user._id
        };


        if (
            type &&
            ![
                "credit",
                "debit"
            ].includes(type)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid transaction type"
            });
        }


        if (type) {
            filter.type = type;
        }


        if (category) {
            filter.category = category;
        }


        if (
            minAmount !== undefined ||
            maxAmount !== undefined
        ) {
            filter.amount = {};
        }


        if (minAmount !== undefined) {

            const min =
                Number(minAmount);

            if (
                !Number.isFinite(min) ||
                min < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid minAmount"
                });
            }

            filter.amount.$gte = min;
        }


        if (maxAmount !== undefined) {

            const max =
                Number(maxAmount);

            if (
                !Number.isFinite(max) ||
                max < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid maxAmount"
                });
            }

            filter.amount.$lte = max;
        }


        if (from || to) {
            filter.createdAt = {};
        }


        if (from) {

            const fromDate =
                new Date(from);

            if (
                Number.isNaN(
                    fromDate.getTime()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid from date"
                });
            }

            filter.createdAt.$gte =
                fromDate;
        }


        if (to) {

            const toDate =
                new Date(to);

            if (
                Number.isNaN(
                    toDate.getTime()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid to date"
                });
            }

            filter.createdAt.$lte =
                toDate;
        }


        const allowedSorts = [
            "newest",
            "oldest",
            "amount_asc",
            "amount_desc"
        ];


        if (
            !allowedSorts.includes(sort)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort"
            });
        }


        const page = Math.max(
            Number(req.query.page) || 1,
            1
        );


        const limit = Math.min(
            Math.max(
                Number(req.query.limit) || 10,
                1
            ),
            50
        );


        const skip =
            (page - 1) * limit;


        let sortObject;


        if (sort === "oldest") {

            sortObject = {
                createdAt: 1
            };

        } else if (
            sort === "amount_asc"
        ) {

            sortObject = {
                amount: 1
            };

        } else if (
            sort === "amount_desc"
        ) {

            sortObject = {
                amount: -1
            };

        } else {

            sortObject = {
                createdAt: -1
            };

        }


        const transactions =
            await Transaction
                .find(filter)
                .sort(sortObject)
                .skip(skip)
                .limit(limit);


        const total =
            await Transaction
                .countDocuments(filter);


        return res.status(200).json({
            success: true,

            pagination: {
                page,
                limit,
                total,

                totalPages:
                    Math.ceil(
                        total / limit
                    )
            },

            transactions
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

# Solution Approach

The most important line is actually:

```js
const filter = {
    user: req.user._id
};
```

Why?

Because the requirement says:

> Search **your** transactions.

The frontend should not send:

```text
?userId=...
```

to determine whose financial data to read.

That would be a serious security problem.

The server already knows the logged-in user.

---

# Building Multiple Ranges

Amount:

```js
filter.amount = {
    $gte: minimum,
    $lte: maximum
};
```

Date:

```js
filter.createdAt = {
    $gte: fromDate,
    $lte: toDate
};
```

Same MongoDB operators work for both numbers and dates.

MongoDB can compare values chronologically when the stored field is a Date.

---

# Pagination Explained Properly

Suppose:

```text
limit = 10
```

Page 1:

```js
skip = (1 - 1) * 10
```

which gives:

```text
0
```

Return:

```text
records 1–10
```

Page 2:

```js
skip = (2 - 1) * 10
```

gives:

```text
10
```

Return:

```text
records 11–20
```

Page 3:

```text
skip = 20
```

---

# `.skip()`

```js
.skip(skip)
```

tells MongoDB:

> Ignore this many matching documents first.

---

# `.limit()`

```js
.limit(limit)
```

means:

> Return at most this many documents.

---

# Why cap limit at 50?

Imagine someone requests:

```text
?limit=999999999
```

Without protection, they are basically asking:

> Hello server, could you please suffer?

So:

```js
Math.min(requestedLimit, 50)
```

protects the API.

---

# `Math.max()`

```js
Math.max(
    Number(req.query.page) || 1,
    1
)
```

ensures page cannot fall below `1`.

---

# `Math.min()`

Used to ensure the limit cannot exceed `50`.

---

# `countDocuments(filter)`

This is important.

Suppose database has:

```text
237 matching transactions
```

But pagination returns only:

```text
10
```

The frontend still needs to know:

```text
Total = 237
Total Pages = 24
```

So:

```js
Transaction.countDocuments(filter)
```

counts all documents matching the filter without pagination.

---

## Test Cases

```text
No filters
→ logged-in user's transactions

type=debit
→ debit only

minAmount=500
→ amount >= 500

from/to dates
→ matching date range

sort=amount_desc
→ highest amount first

page=2&limit=10
→ second page

limit=500
→ capped at 50

invalid minAmount
→ 400

invalid date
→ 400

invalid sort
→ 400
```

---

# Question 9 — Create or Update Your Review

## Problem Statement

You are building a review system.

A user can review a product.

Rules:

- Rating must be between `1` and `5`.
- A user can have only **one review per product**.
- If they have never reviewed the product, create a review.
- If they already reviewed it, update the existing review.

So the same API can perform:

```text
Create
or
Update
```

depending on database state.

---

## Review Model

```js
{
    product: ObjectId,
    user: ObjectId,
    rating: Number,
    comment: String
}
```

---

## API

```http
PUT /api/products/:productId/review
```

Request:

```json
{
    "rating": 4,
    "comment": "Very good overall."
}
```

---

# Student Code Stub

```js
import mongoose from "mongoose";

import Product from "../models/product.model.js";
import Review from "../models/review.model.js";

export const createOrUpdateReview = async (
    req,
    res
) => {
    try {

        const { productId } = req.params;

        const {
            rating,
            comment
        } = req.body;


        // STEP 1:
        // Validate productId


        // STEP 2:
        // Validate rating


        // STEP 3:
        // Find product


        // STEP 4:
        // Handle missing product


        // STEP 5:
        // Find existing review using
        // product + logged-in user


        if (/* review exists */) {

            // Update rating

            // Update comment

            // Save

            // Return 200

        } else {

            // Create review

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

import Product from "../models/product.model.js";
import Review from "../models/review.model.js";

export const createOrUpdateReview = async (
    req,
    res
) => {
    try {

        const { productId } = req.params;

        const {
            rating,
            comment
        } = req.body;


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
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Rating must be an integer between 1 and 5"
            });
        }


        const product =
            await Product.findById(productId);


        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }


        const existingReview =
            await Review.findOne({
                product: product._id,
                user: req.user._id
            });


        if (existingReview) {

            existingReview.rating =
                rating;

            existingReview.comment =
                comment?.trim() || "";


            await existingReview.save();


            return res.status(200).json({
                success: true,
                message:
                    "Review updated successfully",
                review:
                    existingReview
            });
        }


        const review =
            await Review.create({
                product: product._id,
                user: req.user._id,
                rating,
                comment:
                    comment?.trim() || ""
            });


        return res.status(201).json({
            success: true,
            message:
                "Review created successfully",
            review
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

# Solution Approach

The interesting part is:

```js
Review.findOne({
    product: product._id,
    user: req.user._id
});
```

We're not searching by ID.

We're asking:

> Is there already a review belonging to THIS user for THIS product?

Two conditions together create the identity of the review relationship.

---

# Why `findOne()`?

`find()` returns:

```js
[]
```

an array.

`findOne()` returns:

```text
one document
or
null
```

Because the business rule says there should be only one user-product review, `findOne()` communicates the intention better.

---

# `Number.isInteger()`

Ratings allowed:

```text
1
2
3
4
5
```

Should this be accepted?

```text
4.8
```

No.

Therefore:

```js
Number.isInteger(rating)
```

checks whether the number is an integer.

---

# Create vs Update Status Codes

New review:

```text
201 Created
```

Existing review changed:

```text
200 OK
```

Same endpoint, different outcome.

---

# Why `PUT`?

Conceptually, this operation says:

> Set my review for this product to this state.

Calling it repeatedly should result in the same single review being updated instead of creating duplicates.

That's a good fit for `PUT`.

---

# Why not simply always `Review.create()`?

Because the user could create:

```text
Review 1
Review 2
Review 3
Review 4
```

for the same product.

The business rule says:

```text
One user
+
One product
=
One review
```

So we must check first.

---

# `comment?.trim() || ""`

If comment exists:

```js
" Great product ".trim()
```

becomes:

```text
"Great product"
```

If comment is absent:

```js
undefined
```

optional chaining produces:

```js
undefined
```

then:

```js
undefined || ""
```

becomes:

```text
""
```

---

## Test Cases

```text
First review
→ 201

Second request same user/product
→ 200
→ same review updated

Different user reviewing same product
→ creates separate review

rating = 0
→ 400

rating = 6
→ 400

rating = 4.5
→ 400

Invalid productId
→ 400

Missing product
→ 404
```

---

# Question 10 — Deactivate Your Account Securely

## Problem Statement

You are building account settings for an application.

A logged-in user wants to deactivate their account.

Because this is a sensitive action, simply being logged in is not enough.

The user must:

1. Enter their current password.
2. Type the confirmation text:

```text
DEACTIVATE
```

If both checks succeed:

```text
User.isActive = false
```

and the authentication cookie should be removed.

This combines:

```text
Authentication context
Password verification
Sensitive mutation
Cookie management
```

---

## User Model

Assume:

```js
{
    name: String,

    email: String,

    password: String,

    isActive: {
        type: Boolean,
        default: true
    }
}
```

---

## API

```http
POST /api/account/deactivate
```

---

## Request Body

```json
{
    "currentPassword": "secret123",
    "confirmation": "DEACTIVATE"
}
```

---

# Student Code Stub

```js
import bcrypt from "bcrypt";

import User from "../models/user.model.js";

export const deactivateAccount = async (
    req,
    res
) => {
    try {

        const {
            currentPassword,
            confirmation
        } = req.body;


        // STEP 1:
        // Validate required fields


        // STEP 2:
        // Validate confirmation text


        // STEP 3:
        // Load current user from database
        // Password is needed here


        // STEP 4:
        // Handle missing user


        // STEP 5:
        // Compare currentPassword
        // with stored hash


        // STEP 6:
        // Handle incorrect password


        // STEP 7:
        // Set isActive to false


        // STEP 8:
        // Save user


        // STEP 9:
        // Clear authentication cookie


        // STEP 10:
        // Return success response


    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import bcrypt from "bcrypt";

import User from "../models/user.model.js";

export const deactivateAccount = async (
    req,
    res
) => {
    try {

        const {
            currentPassword,
            confirmation
        } = req.body;


        if (
            !currentPassword ||
            !confirmation
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Password and confirmation are required"
            });
        }


        if (
            confirmation !== "DEACTIVATE"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid confirmation text"
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


        const passwordMatches =
            await bcrypt.compare(
                currentPassword,
                user.password
            );


        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message:
                    "Incorrect password"
            });
        }


        user.isActive = false;


        await user.save();


        res.clearCookie("token");


        return res.status(200).json({
            success: true,
            message:
                "Account deactivated successfully"
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

# Solution Approach

The interesting security idea is:

> Authentication proves that a valid session exists. It does not mean every sensitive action should happen without additional verification.

Changing a profile picture:

```text
Normal authenticated action
```

Deactivating an account:

```text
Destructive sensitive action
```

So asking for the current password again is reasonable.

---

# Why fetch the User again?

Authentication middleware might have done:

```js
User.findById(id)
    .select("-password")
```

Therefore:

```js
req.user.password
```

may not exist.

For password verification, we intentionally load the user again:

```js
const user =
    await User.findById(
        req.user._id
    );
```

Now we have the stored hash.

---

# Why not compare passwords directly?

Wrong:

```js
currentPassword === user.password
```

The database contains something like:

```text
$2b$10$Qm...
```

not the actual password.

We need:

```js
bcrypt.compare(
    currentPassword,
    user.password
);
```

---

# `bcrypt.compare()`

It accepts:

```text
plain text password
+
stored bcrypt hash
```

and returns:

```js
true
```

or:

```js
false
```

Example:

```js
const matches =
    await bcrypt.compare(
        "secret123",
        storedHash
    );
```

---

# Why exact confirmation text?

```js
confirmation !== "DEACTIVATE"
```

This protects against accidental clicks or accidental requests.

The user has to consciously perform the destructive action.

---

# Why not delete the user?

Instead of:

```js
User.findByIdAndDelete(...)
```

we use:

```js
user.isActive = false;
```

This is called a **soft deactivation** approach.

Why might that be preferable?

Because the application may still need historical references:

```text
orders
comments
invoices
support tickets
```

If the User document completely disappears, references may become harder to interpret.

---

# `res.clearCookie()`

```js
res.clearCookie("token");
```

tells the browser to remove the authentication cookie.

Otherwise:

```text
Account deactivated
but browser still has authentication cookie
```

which is a confusing state.

---

# Important Follow-Up Architecture

Your authentication middleware should ideally also verify:

```js
if (!user.isActive)
```

and reject deactivated accounts.

For example:

```js
if (!user || !user.isActive) {

    return res.status(401).json({
        success: false,
        message:
            "Authentication required"
    });
}
```

Now even if an old JWT somehow remains available, an inactive user cannot continue using it.

This is why authentication middleware loads the user from the database instead of blindly trusting whatever was true when the JWT was created.

---

## Test Cases

```text
Correct password + confirmation
→ 200
→ isActive becomes false
→ token cookie cleared

Missing password
→ 400

Missing confirmation
→ 400

confirmation = "delete"
→ 400

Wrong password
→ 401

Missing user
→ 404
```

---

# What Changed in Difficulty?

The first batch mostly asked:

```text
Can you validate input?
Can you query MongoDB?
Can you understand authentication?
Can you modify relationships?
```

This batch asks:

```text
Can you combine several of those ideas correctly?
```

| Question | Main Challenge |
|---|---|
| 6. Reschedule Appointment | Dates + ownership + status + conflict detection |
| 7. Borrow Book | Multi-document updates + limits + inventory |
| 8. Transaction Search | Dynamic filters + ranges + dates + pagination |
| 9. Review | `findOne()` + create-vs-update business logic |
| 10. Deactivate Account | Password verification + sensitive action + cookies |

The important shift is that the controller is no longer:

```text
Receive request
→ run one Mongoose function
→ respond
```

It is now:

```text
Receive request
        ↓
Validate shape
        ↓
Validate values
        ↓
Authenticate identity
        ↓
Check ownership/permission
        ↓
Inspect current database state
        ↓
Apply business rules
        ↓
Check conflicts
        ↓
Mutate the correct documents
        ↓
Persist changes
        ↓
Return the correct status
```

That is much closer to how real backend controllers are actually written.
