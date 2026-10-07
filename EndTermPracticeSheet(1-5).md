---

# MERN Backend Practice Sheet
## Batch 1 — Questions 1 to 5

---

# Question 1 — Create an Expense Entry

## Problem Statement

You are building the backend of a personal expense tracking application.

A logged-in user can record expenses such as food, travel, shopping, subscriptions, and bills.

The frontend will send the expense details, but some information must be controlled by the server.

A user should **not** be able to decide which account owns the expense.

The authenticated user is already available as:

```js
req.user._id
```

Your job is to build an API that validates the expense and saves it in MongoDB.

---

## API

```http
POST /api/expenses
```

---

## Expense Model

Assume this model already exists:

```js
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        category: {
            type: String,
            enum: [
                "food",
                "travel",
                "shopping",
                "bills",
                "subscription",
                "other"
            ],
            required: true
        },

        paymentMethod: {
            type: String,
            enum: [
                "cash",
                "card",
                "upi"
            ],
            required: true
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model(
    "Expense",
    expenseSchema
);
```

---

## Request Body

```json
{
    "title": "Dinner",
    "amount": 850,
    "category": "food",
    "paymentMethod": "upi"
}
```

The user must **not** send:

```json
{
    "owner": "SOME_OTHER_USER_ID"
}
```

The server decides that.

---

## Validation Rules

`title` is required and cannot contain only spaces.

`amount` must:

```text
be a number
be greater than 0
```

Allowed categories:

```text
food
travel
shopping
bills
subscription
other
```

Allowed payment methods:

```text
cash
card
upi
```

---

## Success Response

```http
201 Created
```

```json
{
    "success": true,
    "message": "Expense created successfully",
    "expense": {
        "_id": "...",
        "title": "Dinner",
        "amount": 850,
        "category": "food",
        "paymentMethod": "upi",
        "owner": "LOGGED_IN_USER_ID"
    }
}
```

---

# Student Code Stub

```js
import Expense from "../models/expense.model.js";

export const createExpense = async (req, res) => {
    try {

        const {
            title,
            amount,
            category,
            paymentMethod
        } = req.body;


        // STEP 1:
        // Validate title


        // STEP 2:
        // Validate amount


        // STEP 3:
        // Validate category


        // STEP 4:
        // Validate paymentMethod


        // STEP 5:
        // Create the expense.
        // owner must come from req.user._id


        // STEP 6:
        // Return 201 response


    } catch (error) {

        // Handle unexpected errors

    }
};
```

---

# Complete Solution

```js
import Expense from "../models/expense.model.js";

export const createExpense = async (req, res) => {
    try {
        const {
            title,
            amount,
            category,
            paymentMethod
        } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Title is required"
            });
        }

        if (
            typeof amount !== "number" ||
            amount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Amount must be greater than 0"
            });
        }

        const allowedCategories = [
            "food",
            "travel",
            "shopping",
            "bills",
            "subscription",
            "other"
        ];

        if (
            !allowedCategories.includes(
                category
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid category"
            });
        }

        const allowedPaymentMethods = [
            "cash",
            "card",
            "upi"
        ];

        if (
            !allowedPaymentMethods.includes(
                paymentMethod
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment method"
            });
        }

        const expense =
            await Expense.create({
                title: title.trim(),
                amount,
                category,
                paymentMethod,

                owner:
                    req.user._id
            });

        return res.status(201).json({
            success: true,
            message:
                "Expense created successfully",
            expense
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

The flow is:

```text
Request
   ↓
Read req.body
   ↓
Validate every client-controlled field
   ↓
Take owner from req.user
   ↓
Expense.create()
   ↓
MongoDB
   ↓
201 Created
```

---

## Why `req.body`?

The frontend sends:

```json
{
    "title": "Dinner",
    "amount": 850
}
```

Express makes that available through:

```js
req.body
```

assuming:

```js
app.use(express.json());
```

has been configured.

---

## Why `title?.trim()`?

Consider:

```js
title = "      ";
```

Technically:

```js
Boolean("      ")
```

is:

```js
true
```

That means this validation is not enough:

```js
if (!title)
```

But:

```js
"      ".trim()
```

becomes:

```js
""
```

Now we can correctly reject it.

---

## What does `?.` mean?

```js
title?.trim()
```

is optional chaining.

If `title` is undefined, JavaScript does not attempt:

```js
undefined.trim()
```

which would crash.

Instead, it safely returns:

```js
undefined
```

---

## Why `typeof amount !== "number"`?

The frontend could send:

```json
{
    "amount": "850"
}
```

That looks like a number, but it is actually a string.

```js
typeof "850"
```

returns:

```text
string
```

We want the API contract to stay predictable.

---

## Why `.includes()`?

```js
allowedCategories.includes(category)
```

asks:

> Does this value exist inside my list of allowed values?

For example:

```js
[
    "food",
    "travel",
    "shopping"
].includes("travel")
```

returns:

```js
true
```

But:

```js
.includes("cryptocurrency")
```

returns:

```js
false
```

This is cleaner than writing:

```js
category === "food" ||
category === "travel" ||
category === "shopping"
```

---

## Why is `owner` not read from `req.body`?

Very important security idea.

Bad:

```js
owner: req.body.owner
```

A malicious user could send somebody else's ID.

Correct:

```js
owner: req.user._id
```

Authentication middleware has already determined who made the request.

The server should trust that identity, not a random value from the frontend.

A useful rule:

> If the server already knows something, do not ask the client to tell you again.

---

## What does `Expense.create()` do?

```js
await Expense.create({...})
```

roughly means:

```text
Create Mongoose document
        ↓
Validate against schema
        ↓
Insert into MongoDB
        ↓
Return saved document
```

---

## Common Mistakes

Do not do:

```js
Expense.create(req.body);
```

because the frontend may send extra fields.

Do not do:

```js
owner: req.body.owner
```

because ownership must be server-controlled.

---

## Test Cases

| Input | Expected |
|---|---|
| Valid expense | 201 |
| Empty title | 400 |
| `"     "` title | 400 |
| Amount `0` | 400 |
| Negative amount | 400 |
| Amount `"500"` | 400 |
| Invalid category | 400 |
| Invalid payment method | 400 |

---

## Mental Model

```text
Client controls:
title
amount
category
paymentMethod

Server controls:
owner
```

---

# Question 2 — Search Rental Properties

## Problem Statement

You are building a property rental platform.

Users need to search available properties based on multiple filters.

Build one API capable of combining:

```text
city
minimum rent
maximum rent
minimum bedrooms
property name search
rent sorting
```

All filters are optional.

---

## API

```http
GET /api/properties
```

Examples:

```http
GET /api/properties
```

```http
GET /api/properties?city=Bengaluru
```

```http
GET /api/properties?minRent=15000&maxRent=30000
```

```http
GET /api/properties?bedrooms=2
```

```http
GET /api/properties?search=lake
```

```http
GET /api/properties?sort=rent_low
```

```http
GET /api/properties?city=Bengaluru&bedrooms=2&maxRent=30000
```

---

## Property Model

```js
{
    title: String,
    city: String,
    rent: Number,
    bedrooms: Number,
    available: Boolean
}
```

Only available properties should be returned.

---

## Supported Sort Values

```text
rent_low
rent_high
```

---

# Student Code Stub

```js
import Property from "../models/property.model.js";

export const searchProperties = async (
    req,
    res
) => {
    try {

        const {
            city,
            minRent,
            maxRent,
            bedrooms,
            search,
            sort
        } = req.query;


        // STEP 1:
        // Start filter with available: true


        // STEP 2:
        // Add city


        // STEP 3:
        // Add rent range


        // STEP 4:
        // Validate and add minimum bedrooms


        // STEP 5:
        // Add case-insensitive title search


        // STEP 6:
        // Validate sort


        // STEP 7:
        // Create Mongoose query


        // STEP 8:
        // Apply sorting


        // STEP 9:
        // Execute and return results


    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import Property from "../models/property.model.js";

export const searchProperties = async (
    req,
    res
) => {
    try {
        const {
            city,
            minRent,
            maxRent,
            bedrooms,
            search,
            sort
        } = req.query;

        const filter = {
            available: true
        };

        if (city) {
            filter.city = city;
        }

        if (
            minRent !== undefined ||
            maxRent !== undefined
        ) {
            filter.rent = {};
        }

        if (minRent !== undefined) {
            const minimum =
                Number(minRent);

            if (
                !Number.isFinite(minimum) ||
                minimum < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid minRent"
                });
            }

            filter.rent.$gte =
                minimum;
        }

        if (maxRent !== undefined) {
            const maximum =
                Number(maxRent);

            if (
                !Number.isFinite(maximum) ||
                maximum < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid maxRent"
                });
            }

            filter.rent.$lte =
                maximum;
        }

        if (bedrooms !== undefined) {
            const minimumBedrooms =
                Number(bedrooms);

            if (
                !Number.isInteger(
                    minimumBedrooms
                ) ||
                minimumBedrooms < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid bedrooms value"
                });
            }

            filter.bedrooms = {
                $gte: minimumBedrooms
            };
        }

        if (search) {
            filter.title = {
                $regex: search,
                $options: "i"
            };
        }

        if (
            sort &&
            ![
                "rent_low",
                "rent_high"
            ].includes(sort)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort"
            });
        }

        let query =
            Property.find(filter);

        if (sort === "rent_low") {
            query = query.sort({
                rent: 1
            });
        }

        if (sort === "rent_high") {
            query = query.sort({
                rent: -1
            });
        }

        const properties =
            await query;

        return res.status(200).json({
            success: true,
            count: properties.length,
            properties
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

Start with the condition that must **always** exist:

```js
const filter = {
    available: true
};
```

Then progressively build the rest.

Example request:

```text
?city=Bengaluru&minRent=15000&bedrooms=2
```

Eventually becomes approximately:

```js
{
    available: true,

    city: "Bengaluru",

    rent: {
        $gte: 15000
    },

    bedrooms: {
        $gte: 2
    }
}
```

MongoDB treats these different properties as:

```text
available = true
AND city = Bengaluru
AND rent >= 15000
AND bedrooms >= 2
```

---

## Why `Number()`?

Remember:

```js
req.query.minRent
```

comes from the URL.

So even:

```text
?minRent=15000
```

usually arrives as:

```js
"15000"
```

a string.

We convert:

```js
Number(minRent)
```

to:

```js
15000
```

---

## Why `Number.isFinite()`?

Consider:

```js
Number("hello")
```

returns:

```js
NaN
```

Using:

```js
Number.isFinite(value)
```

ensures the final value is an actual finite number.

---

## `$gte`

```js
$gte
```

means:

```text
greater than or equal to
```

So:

```js
{
    rent: {
        $gte: 15000
    }
}
```

means:

```text
rent >= 15000
```

---

## `$lte`

Means:

```text
less than or equal to
```

Therefore:

```js
{
    rent: {
        $gte: 15000,
        $lte: 30000
    }
}
```

means:

```text
15000 <= rent <= 30000
```

---

## `$regex`

```js
filter.title = {
    $regex: search,
    $options: "i"
};
```

Suppose:

```text
search=lake
```

Can match:

```text
Lake View Apartment
Lakeside Residency
LAKE HOUSE
```

---

## Why `$options: "i"`?

`i` means:

```text
case insensitive
```

Without it:

```text
lake
```

might behave differently from:

```text
Lake
```

---

## Why `let query`?

```js
let query =
    Property.find(filter);
```

We haven't executed it yet.

We can still modify it:

```js
query = query.sort(...)
```

Then finally:

```js
const properties =
    await query;
```

That is when it actually executes.

---

## `.sort({ rent: 1 })`

`1`:

```text
ascending
```

Example:

```text
₹10,000
₹15,000
₹20,000
```

`-1`:

```text
descending
```

---

## Common Mistake

Do not do:

```js
const properties =
    await Property.find(filter);

properties.sort(...)
```

when MongoDB can do the sorting directly.

Let the database do database work.

---

## Test Cases

```text
No filters
→ all available properties

city=Bengaluru
→ only Bengaluru

minRent=20000
→ rent >= 20000

maxRent=30000
→ rent <= 30000

bedrooms=2
→ bedrooms >= 2

search=lake
→ case-insensitive title match

sort=rent_low
→ lowest rent first

sort=random
→ 400

minRent=hello
→ 400
```

---

# Question 3 — Change Delivery Address of Your Order

## Problem Statement

You are building an e-commerce order system.

A logged-in user may update the delivery address of **their own order**, but only while that order is still:

```text
pending
```

Once an order becomes:

```text
shipped
delivered
cancelled
```

the address cannot be changed.

This question combines:

```text
ObjectId validation
Ownership
Authorization
Business rules
Whitelisted updates
```

---

## API

```http
PATCH /api/orders/:orderId/address
```

---

## Request

```json
{
    "address": {
        "line1": "221B MG Road",
        "city": "Bengaluru",
        "pincode": "560001"
    }
}
```

---

## Order Structure

```js
{
    user: ObjectId,

    status: String,

    deliveryAddress: {
        line1: String,
        city: String,
        pincode: String
    }
}
```

---

# Student Code Stub

```js
import mongoose from "mongoose";
import Order from "../models/order.model.js";

export const updateDeliveryAddress = async (
    req,
    res
) => {
    try {

        const { orderId } = req.params;
        const { address } = req.body;


        // STEP 1:
        // Validate orderId


        // STEP 2:
        // Validate address object


        // STEP 3:
        // Find order


        // STEP 4:
        // Handle missing order


        // STEP 5:
        // Check ownership


        // STEP 6:
        // Ensure status is pending


        // STEP 7:
        // Update deliveryAddress


        // STEP 8:
        // Save order


        // STEP 9:
        // Return response


    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import mongoose from "mongoose";
import Order from "../models/order.model.js";

export const updateDeliveryAddress = async (
    req,
    res
) => {
    try {
        const { orderId } = req.params;
        const { address } = req.body;

        if (
            !mongoose.isValidObjectId(
                orderId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order id"
            });
        }

        if (
            !address ||
            !address.line1?.trim() ||
            !address.city?.trim() ||
            !address.pincode?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Complete delivery address is required"
            });
        }

        const order =
            await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (
            !order.user.equals(
                req.user._id
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You cannot modify this order"
            });
        }

        if (order.status !== "pending") {
            return res.status(400).json({
                success: false,
                message:
                    "Address cannot be changed after order processing begins"
            });
        }

        order.deliveryAddress = {
            line1:
                address.line1.trim(),

            city:
                address.city.trim(),

            pincode:
                address.pincode.trim()
        };

        await order.save();

        return res.status(200).json({
            success: true,
            message:
                "Delivery address updated successfully",
            order
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

The important order here is:

```text
Is the ID valid?
       ↓
Is request data valid?
       ↓
Does order exist?
       ↓
Does it belong to me?
       ↓
Can this order still be modified?
       ↓
Update
```

Notice how many checks happen before mutation.

That is intentional.

---

## Why validate before querying?

```js
mongoose.isValidObjectId(orderId)
```

prevents malformed IDs like:

```text
hello
123xyz
```

from reaching:

```js
Order.findById(...)
```

---

## Why `.equals()`?

This is wrong or unreliable:

```js
order.user === req.user._id
```

because MongoDB ObjectIds are objects.

Use:

```js
order.user.equals(
    req.user._id
)
```

That compares the underlying ObjectId value.

---

## Why `403` here?

The user is authenticated.

We know who they are.

But the order belongs to somebody else.

Therefore:

```text
403 Forbidden
```

Mental distinction:

```text
401 = Who are you?

403 = I know who you are.
      You still cannot do this.
```

---

## Business Rule

```js
if (order.status !== "pending")
```

This is not a MongoDB problem.

This is not an Express problem.

This is a **business requirement**.

Backend engineering is often:

```text
Database code
+
Business rules
```

not simply CRUD.

---

## Why `.save()`?

We already have the document:

```js
const order =
    await Order.findById(orderId);
```

Then:

```js
order.deliveryAddress = {...};
```

changes the in-memory Mongoose document.

Finally:

```js
await order.save();
```

persists those changes.

Think:

```text
Modify JavaScript document
        ↓
.save()
        ↓
MongoDB updated
```

---

## Common Mistake

This would be dangerous:

```js
Order.findByIdAndUpdate(
    orderId,
    req.body
);
```

Why?

The user might send:

```json
{
    "status": "delivered",
    "total": 0,
    "user": "SOME_OTHER_USER"
}
```

Only update what the endpoint is explicitly meant to update.

---

## Test Cases

```text
Own pending order + valid address
→ 200

Invalid orderId
→ 400

Missing address
→ 400

Order doesn't exist
→ 404

Someone else's order
→ 403

Own shipped order
→ 400

Own delivered order
→ 400
```

---

# Question 4 — Enroll / Withdraw from a Course

## Problem Statement

You are building an online learning platform.

A student can enroll in a course.

Calling the same endpoint again should withdraw them.

The relationship is stored on **both documents**.

Course:

```js
{
    students: [ObjectId],
    capacity: Number
}
```

User:

```js
{
    enrolledCourses: [ObjectId]
}
```

Both documents must remain synchronized.

---

## API

```http
POST /api/courses/:courseId/enrollment
```

Authenticated student:

```js
req.user._id
```

---

## Requirements

If student is not enrolled:

```text
Enroll
```

If student is already enrolled:

```text
Withdraw
```

You must also:

```text
validate course ID
ensure course exists
ensure student exists
respect course capacity
prevent duplicate IDs
update both documents
```

---

# Student Code Stub

```js
import mongoose from "mongoose";

import Course from "../models/course.model.js";
import User from "../models/user.model.js";

export const toggleEnrollment = async (
    req,
    res
) => {
    try {

        const { courseId } = req.params;
        const studentId = req.user._id;


        // STEP 1:
        // Validate courseId


        // STEP 2:
        // Find course


        // STEP 3:
        // Find student


        // STEP 4:
        // Handle missing records


        // STEP 5:
        // Check whether student
        // is already enrolled


        if (/* already enrolled */) {

            // Remove student from course

            // Remove course from student

            // Save both

            // Return withdrawal response

        } else {

            // Check course capacity

            // Add student to course

            // Add course to student

            // Save both

            // Return enrollment response

        }


    } catch (error) {

    }
};
```

---

# Complete Solution

```js
import mongoose from "mongoose";

import Course from "../models/course.model.js";
import User from "../models/user.model.js";

export const toggleEnrollment = async (
    req,
    res
) => {
    try {
        const { courseId } = req.params;
        const studentId =
            req.user._id;

        if (
            !mongoose.isValidObjectId(
                courseId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid course id"
            });
        }

        const course =
            await Course.findById(courseId);

        const student =
            await User.findById(studentId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const alreadyEnrolled =
            course.students.some(
                id =>
                    id.equals(student._id)
            );

        if (alreadyEnrolled) {

            course.students =
                course.students.filter(
                    id =>
                        !id.equals(
                            student._id
                        )
                );

            student.enrolledCourses =
                student.enrolledCourses.filter(
                    id =>
                        !id.equals(
                            course._id
                        )
                );

            await course.save();
            await student.save();

            return res.status(200).json({
                success: true,
                enrolled: false,
                message:
                    "Withdrawn from course successfully"
            });
        }

        if (
            course.students.length >=
            course.capacity
        ) {
            return res.status(400).json({
                success: false,
                message: "Course is full"
            });
        }

        course.students.push(
            student._id
        );

        student.enrolledCourses.push(
            course._id
        );

        await course.save();
        await student.save();

        return res.status(200).json({
            success: true,
            enrolled: true,
            message:
                "Enrolled in course successfully"
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

This problem is interesting because one action affects two documents.

Enrollment means:

```text
Course.students
      +
User.enrolledCourses
```

Both need to agree.

Otherwise your database can become hilariously confused:

```text
Course:
"Rahul is enrolled."

Rahul:
"I have never seen this course in my life."
```

Not ideal.

---

## `.some()`

```js
course.students.some(...)
```

asks:

> Does at least one element satisfy this condition?

It returns:

```text
true
or
false
```

Perfect for membership checks.

---

## Why `.equals()` inside `.some()`?

```js
id.equals(student._id)
```

because `id` is an ObjectId.

---

## `.filter()`

For withdrawal:

```js
course.students =
    course.students.filter(
        id =>
            !id.equals(student._id)
    );
```

`.filter()` creates a new array containing only values for which the condition is true.

Here our condition says:

```text
keep every ID
except the student's ID
```

Suppose:

```js
[A, B, C]
```

Student is B.

After filtering:

```js
[A, C]
```

---

## `.push()`

Enrollment:

```js
course.students.push(
    student._id
);
```

adds the student's ObjectId.

And:

```js
student.enrolledCourses.push(
    course._id
);
```

adds the course to the student's account.

---

## Why check capacity before push?

```js
if (
    course.students.length >=
    course.capacity
)
```

Suppose:

```text
capacity = 50
students.length = 50
```

Adding another student would violate the business rule.

---

## Why can't duplicates happen?

We first check:

```js
alreadyEnrolled
```

If true, we enter withdrawal logic.

We never push again.

Therefore:

```js
students = [
    Rahul,
    Rahul,
    Rahul
]
```

does not happen through this API.

---

## Test Cases

```text
Not enrolled + available capacity
→ enrolled = true

Call same API again
→ enrolled = false

Invalid courseId
→ 400

Missing course
→ 404

Full course
→ 400

Enrollment
→ both Course and User updated

Withdrawal
→ both Course and User updated
```

---

# Question 5 — Protect Premium Content Using JWT and Cookies

## Problem Statement

Your application has premium articles.

Users have already logged in elsewhere in the system.

The login system has stored a JWT inside an HTTP-only cookie named:

```text
token
```

Now you must implement:

1. Reusable authentication middleware.
2. A premium-content controller.

Only authenticated users with an active premium subscription should be allowed to access the article.

This gives students JWT practice **without simply repeating the login question from Set A or Set B**.

---

## User Model

Assume:

```js
{
    name: String,
    email: String,
    password: String,

    subscription: {
        plan: String,
        expiresAt: Date
    }
}
```

Possible plans:

```text
free
premium
```

---

## API

```http
GET /api/articles/:articleId/premium
```

---

## JWT Payload

Assume the login system created the token like:

```js
jwt.sign(
    {
        userId: user._id
    },
    process.env.JWT_SECRET
);
```

---

# Student Code Stub — Authentication Middleware

```js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authenticate = async (
    req,
    res,
    next
) => {
    try {

        // STEP 1:
        // Read token from req.cookies


        // STEP 2:
        // Reject missing token


        // STEP 3:
        // Verify JWT


        // STEP 4:
        // Find user using decoded userId


        // STEP 5:
        // Exclude password


        // STEP 6:
        // Handle deleted/missing user


        // STEP 7:
        // Attach user to req.user


        // STEP 8:
        // Call next()


    } catch (error) {

        // Handle invalid or expired JWT

    }
};
```

---

# Student Code Stub — Premium Controller

```js
import Article from "../models/article.model.js";

export const getPremiumArticle = async (
    req,
    res
) => {
    try {

        // STEP 1:
        // Check user's subscription plan


        // STEP 2:
        // Check subscription expiry


        // STEP 3:
        // Find article


        // STEP 4:
        // Handle article not found


        // STEP 5:
        // Return article


    } catch (error) {

    }
};
```

---

# Student Route

```js
router.get(
    "/:articleId/premium",

    // Add middleware

    // Add controller
);
```

---

# Complete Authentication Middleware

```js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authenticate = async (
    req,
    res,
    next
) => {
    try {
        const token =
            req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required"
            });
        }

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        const user =
            await User
                .findById(
                    decoded.userId
                )
                .select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required"
            });
        }

        req.user = user;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired token"
        });
    }
};
```

---

# Complete Premium Article Controller

```js
import mongoose from "mongoose";
import Article from "../models/article.model.js";

export const getPremiumArticle = async (
    req,
    res
) => {
    try {
        const { articleId } =
            req.params;

        if (
            req.user.subscription?.plan
            !== "premium"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Premium subscription required"
            });
        }

        const expiryDate =
            new Date(
                req.user.subscription.expiresAt
            );

        if (expiryDate <= new Date()) {
            return res.status(403).json({
                success: false,
                message:
                    "Premium subscription has expired"
            });
        }

        if (
            !mongoose.isValidObjectId(
                articleId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid article id"
            });
        }

        const article =
            await Article.findById(
                articleId
            );

        if (!article) {
            return res.status(404).json({
                success: false,
                message:
                    "Article not found"
            });
        }

        return res.status(200).json({
            success: true,
            article
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

# Complete Route

```js
router.get(
    "/:articleId/premium",
    authenticate,
    getPremiumArticle
);
```

---

# Authentication Middleware Explained

## `req.cookies?.token`

Cookie parser gives us:

```js
req.cookies
```

Suppose browser sends:

```text
token=eyJhbGciOiJI...
```

Then:

```js
req.cookies.token
```

contains the JWT.

Optional chaining:

```js
req.cookies?.token
```

prevents an error if `req.cookies` is missing.

---

# Why HTTP-only cookies?

With:

```js
httpOnly: true
```

frontend JavaScript cannot normally read the cookie using:

```js
document.cookie
```

This helps reduce exposure of authentication tokens to client-side scripts.

---

# `jwt.verify()`

```js
jwt.verify(
    token,
    process.env.JWT_SECRET
);
```

checks whether:

```text
JWT signature is valid
JWT has not been modified
JWT is not expired
```

If verification fails, `jwt.verify()` throws.

That is why this works nicely inside:

```js
try {
    ...
} catch {
    return 401;
}
```

---

# What is `decoded`?

If JWT payload was:

```js
{
    userId: "123"
}
```

then:

```js
const decoded =
    jwt.verify(...);
```

can give:

```js
{
    userId: "123",
    iat: ...,
    exp: ...
}
```

Now we can load the actual user.

---

# Why find the user again?

Why not simply trust the JWT forever?

Because between login and this request:

```text
user may have been deleted
user may have changed
subscription may have changed
role may have changed
```

So:

```js
User.findById(decoded.userId)
```

loads the current database state.

---

# `.select("-password")`

The minus sign means:

```text
exclude this field
```

So:

```js
.select("-password")
```

returns the user without the password hash.

Even hashes should not casually travel around your application.

---

# `req.user = user`

Authentication middleware produces:

```js
req.user
```

The next controller does not need to decode JWT again.

Architecture:

```text
Cookie
 ↓
authenticate
 ↓
JWT verification
 ↓
User lookup
 ↓
req.user
 ↓
Premium controller
```

This is separation of concerns.

---

# `next()`

```js
next();
```

means:

> Authentication succeeded. Continue processing this request.

If you forget it, the request just sits there doing absolutely nothing. A very secure application indeed — nobody gets anything.

Unfortunately, also completely broken.

---

# Premium Authorization Explained

Authentication asks:

```text
Who are you?
```

Premium authorization asks:

```text
Are you allowed to access this?
```

They are different problems.

---

## Why `403` for non-premium users?

The user is authenticated.

Therefore `401` would be wrong.

They simply lack permission.

So:

```text
403 Forbidden
```

---

# Date Comparison

```js
const expiryDate =
    new Date(
        req.user.subscription.expiresAt
    );
```

Current time:

```js
new Date()
```

Then:

```js
expiryDate <= new Date()
```

means:

```text
Subscription expiry
is before or equal to
current time
```

Therefore it has expired.

---

# Why middleware runs first

Route:

```js
router.get(
    "/:articleId/premium",
    authenticate,
    getPremiumArticle
);
```

Flow:

```text
Request
   ↓
authenticate
   ↓
req.user created
   ↓
getPremiumArticle
   ↓
req.user.subscription checked
```

If you reverse them:

```js
getPremiumArticle,
authenticate
```

then the controller tries:

```js
req.user.subscription
```

before `req.user` exists.

Order matters.

---

# Test Cases

```text
No cookie
→ 401

Invalid token
→ 401

Expired JWT
→ 401

JWT points to deleted user
→ 401

Authenticated free user
→ 403

Premium user whose subscription expired
→ 403

Active premium user + invalid articleId
→ 400

Active premium user + missing article
→ 404

Active premium user + valid article
→ 200
```

---

# What These Five Questions Actually Taught

| Concept | Practised In |
|---|---|
| `req.body` | Expense creation, address update |
| `req.params` | Order, course, article |
| `req.query` | Property search |
| `req.cookies` | JWT authentication |
| `req.user` | Expense, order, course, premium access |
| `Model.create()` | Expense |
| `find()` | Property search |
| `findById()` | Order, course, article, user |
| `.save()` | Order and course relationships |
| `.select()` | Authentication |
| `.sort()` | Rental search |
| `isValidObjectId()` | Order/course/article validation |
| `$gte` | Minimum rent/bedrooms |
| `$lte` | Maximum rent |
| `$regex` | Property name search |
| `$options: "i"` | Case-insensitive matching |
| `.includes()` | Enum and sort validation |
| `.some()` | Enrollment membership |
| `.filter()` | Enrollment removal |
| `.push()` | Enrollment creation |
| `.equals()` | ObjectId ownership/membership |
| `jwt.verify()` | Authentication |
| Optional chaining `?.` | Safe property access |
| `next()` | Middleware flow |
| Date comparison | Subscription expiry |
| `401` | Not authenticated |
| `403` | Authenticated but not permitted |
| `404` | Resource missing |
| `201` | Resource created |

The larger pattern students should start seeing is:

```text
Where is my input coming from?
        ↓
Can I trust it?
        ↓
What validations apply?
        ↓
Who is making this request?
        ↓
Are they allowed to do it?
        ↓
What business rule applies?
        ↓
Which Mongoose operation fits?
        ↓
What should mutate?
        ↓
What response/status code represents the result?
```

Once that sequence becomes instinctive, students stop trying to memorize controllers and start **designing them**.
