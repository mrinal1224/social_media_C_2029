# End-Term Software Project
## Project Submission Guidelines

The End-Term Project is an opportunity for you to independently design, build, deploy, and demonstrate a **complete software application**.

You are free to build **any software product of your choice**.

There is no fixed problem statement, domain, or compulsory technology stack.

You may build a web application, mobile application, desktop application, developer tool, productivity tool, SaaS product, social/community platform, marketplace, collaboration tool, learning platform, AI-powered application, automation platform, data-driven application, or any other meaningful software product.

The important requirement is that your submission must be a **working software application**, not simply a static website, presentation, design prototype, or collection of disconnected scripts.

---

# Submission Deadline

## **27 October 2026, 11:59 PM IST**

All parts of the project must be ready and accessible before the deadline.

This includes:

- Final source code
- GitHub repository
- Deployed application / accessible build
- README and documentation
- Demo video
- Final submission form

### Official Submission Form

**Submit your final project here:**  
https://forms.gle/sBy4sfqyiRG2Zpom9

Your project will be considered submitted only after the submission form has been completed.

Before submitting, verify that all links are accessible to evaluators.

---

# 1. Technology Stack

There is **no compulsory technology stack** for this project.

You are free to choose the technologies that make sense for your product.

You may use any frontend framework, backend technology, database, programming language, cloud platform, external API, AI model, authentication provider, storage provider, or infrastructure required by your application.

### Your technology choices are engineering decisions.

Using more technologies does not automatically make a project better.

Choose technologies because your application needs them.

---

# 2. What Must Be Built

Your submission must be a **functional software application**.

It should allow a user to perform meaningful actions and should contain actual application logic.

For example:

```text
User
  ↓
Performs an Action
  ↓
Application Processes the Action
  ↓
Data / State Changes
  ↓
Application Responds
  ↓
User Sees the Result
```

The exact architecture will depend on what you choose to build.

There is no single correct architecture.

Your architecture should make sense for the problem you are solving.

---

# 3. Product Expectations

Before building the application, you should clearly understand:

- Who is the user?
- What problem are you solving?
- What can the user actually do with your product?
- What are the most important workflows?
- Why should this exist as software?

A technically complicated application without a clear use case is not necessarily stronger than a smaller application with well-designed workflows.

---

# 4. Engineering Depth

A basic tutorial-level application is not sufficient for an end-term submission.

Your application should contain meaningful engineering decisions.

Depending on your project, this could include:

- Authentication
- Authorization
- Persistent data
- State management
- Search
- Filtering
- User-generated content
- File handling
- Payments
- Real-time communication
- Notifications
- Background jobs
- External API integrations
- AI / LLM integration
- Recommendations
- Collaboration
- Role-based functionality
- Offline functionality
- Data synchronization
- Analytics
- Caching
- Queues
- Scheduling
- Geolocation
- Media processing

**Not every project needs all of these.**

The features you implement should emerge naturally from the problem you are solving.

Do not add technical complexity simply to satisfy a checklist.

---

# 5. Application Logic

Your project must contain meaningful application logic beyond displaying information.

For example, a booking application should ideally represent an actual workflow:

```text
Search
   ↓
Check Availability
   ↓
Select Slot
   ↓
Validate Booking
   ↓
Create Reservation
   ↓
Update Availability
   ↓
Show Confirmation
```

Similarly, an AI application should not simply be:

```text
Text Box
   ↓
LLM API
   ↓
Display Response
```

There should be meaningful software engineering around the model.

The intelligence of an external API does not replace the engineering expected from the project.

---

# 6. Data and Persistence

If your application generates or manages information that should survive between sessions, that information should be persisted appropriately.

You may use any suitable database or storage technology.

Your data model should represent the requirements of your product.

Not every application necessarily requires a traditional database. If your product does not require one, that is acceptable.

---

# 7. Authentication and Authorization

Authentication is **not compulsory for every project**.

It should be implemented when the product requires user identity.

If your application contains personal accounts, private information, user-specific data, administrative functionality, different user roles, or ownership of resources, appropriate authentication and authorization mechanisms are expected.

You may choose any appropriate authentication solution.

---

# 8. User Experience

Your project does not need to look like a professionally designed commercial product.

However, it should be usable.

Users should be able to understand:

- What the application does
- How to navigate it
- How to perform its major actions
- Whether an operation succeeded or failed

Appropriate loading, empty, success, and error states should be handled wherever relevant.

---

# 9. Error Handling

Real software does not only handle successful cases.

Your application should appropriately handle failures relevant to your product.

Examples include:

- Invalid user input
- Failed network requests
- Unauthorized operations
- Missing resources
- Duplicate operations
- Failed external APIs
- Database errors
- Upload failures
- Invalid application states

Think about:

**What can go wrong in this workflow?**

Your application should behave appropriately when those situations occur.

---

# 10. Security

You are expected to follow reasonable security practices for the technologies you choose.

For example:

- Do not expose API keys or secrets.
- Do not commit credentials to GitHub.
- Do not store passwords in plain text.
- Validate important user input.
- Protect private user data.
- Implement authorization where required.
- Keep secrets in environment variables or appropriate secret-management systems.

Security expectations will depend on the architecture of your application.

---

# 11. Git and Version Control

Your complete source code must be maintained using Git.

The repository should demonstrate the development of the project rather than appearing as a single final upload.

We expect:

- Meaningful commit history
- Reasonable commit messages
- Appropriate project structure
- Required configuration files
- Documentation
- No exposed secrets

Avoid uploading the entire completed project in one final commit.

---

# 12. Deployment

The final application should be available in a form that evaluators can run or access.

For web applications, this will normally mean a publicly accessible deployment.

For mobile, desktop, CLI, developer tools, or other types of software, provide appropriate installation instructions, builds, packages, or executable versions.

An evaluator should not have to reverse-engineer your repository simply to see the project working.

---

# 13. README and Documentation

Every project must contain proper documentation.

Your README should include:

### Project Name

### Problem Statement
What problem are you solving?

### Target Users
Who is the application built for?

### Solution
How does your product solve the problem?

### Key Features
What can users actually do?

### Tech Stack
What technologies did you use?

### Architecture
Explain the major components of your application.

### Local Setup
Provide clear instructions for running the application.

### Environment Variables
Document required configuration without exposing secrets.

### Deployment
Provide links or instructions for accessing the final application.

---

# 14. Demo Video

Submit a short video demonstrating your final product.

**Recommended duration: 3–5 minutes**

Your demo should show:

1. The problem being solved
2. Who the product is for
3. The major workflows
4. The most interesting functionality
5. The final working application

Do not spend the majority of the demo reading code.

**Show the product working.**

---

# 15. AI Usage

AI tools are allowed.

You may use AI for:

- Brainstorming
- Learning
- Debugging
- Code generation
- Refactoring
- Documentation
- Testing
- Understanding unfamiliar technologies

However, the final submission should represent a complete and functional software product.

AI-generated code does not excuse:

- Broken functionality
- Poor architecture
- Exposed credentials
- Missing error handling
- Incomplete workflows
- Copied projects
- Non-functional deployments

Use AI as an engineering tool rather than treating generated code as the final product.

---

# 16. Originality

You may use open-source libraries, frameworks, APIs, documentation, tutorials, AI tools, existing research, and code examples.

This is normal software development.

However, submitting an existing project with minor modifications is not considered original engineering work.

If your project significantly builds upon an existing open-source project, clearly mention it in your documentation.

---

# 17. What Will NOT Be Considered a Complete End-Term Project

### Static Websites

Portfolio websites, landing pages, or informational sites with little or no application logic.

### UI-Only Projects

A polished frontend containing mostly hardcoded or mock data without meaningful functionality.

### Tutorial Clones

Applications that substantially reproduce an existing tutorial without meaningful independent work.

### Basic CRUD Applications

Projects where the complete product is essentially:

```text
Create
Read
Update
Delete
```

with no meaningful workflow or application logic.

### Basic API Wrappers

Applications whose primary implementation is:

```text
User Input
   ↓
Third-Party API
   ↓
Display Response
```

with little engineering beyond the integration.

### Incomplete Products

Applications containing many advertised features where the major workflows do not actually work.

---

# 18. Scope

You are not being evaluated on how many features you can list.

Identify approximately **3–5 important workflows** and implement them properly.

A smaller application with complete, reliable workflows is preferable to a large application containing many incomplete features.

**Depth > Feature Count**

---

# 19. Evaluation

Projects will be evaluated based on the submitted application, source code, documentation, deployment, and demo.

| Area | Weightage |
|---|---:|
| Problem & Product Understanding | 10% |
| Core Product Implementation | 25% |
| Engineering & Application Logic | 20% |
| Architecture & Technical Decisions | 15% |
| User Experience & Reliability | 10% |
| Code Quality & Project Structure | 10% |
| Deployment & Documentation | 10% |
| **Total** | **100%** |

The evaluator will consider the context of the project.

A mobile application, AI application, web platform, developer tool, and desktop application should not be expected to have identical architectures or features.

The evaluation will focus on **whether the chosen solution is appropriate and how well the final software has been built.**

---

# 20. Final Submission

Every submission must contain:

```text
Project Name:

Student Name:

Problem Statement:

GitHub Repository:

Deployed Application / Build:

Demo Video:

Tech Stack:

Major Features:
```

Submit these details using the official submission form:

**https://forms.gle/sBy4sfqyiRG2Zpom9**

### Deadline: **27 October 2026, 11:59 PM IST**

Before submitting, open your GitHub repository, deployment/build, and demo video links in an incognito/private window to verify that they are accessible without requesting additional permissions.

---

# 21. Final Checklist

Before submitting:

- [ ] The project is a functional software application
- [ ] The problem and target user are clearly defined
- [ ] Core workflows actually work
- [ ] The application contains meaningful engineering logic
- [ ] Important failures are handled
- [ ] No secrets or credentials are exposed
- [ ] Source code is accessible
- [ ] Git history demonstrates development
- [ ] README explains the project
- [ ] Technical architecture is documented
- [ ] Application is deployed or easily runnable
- [ ] Demo video is accessible
- [ ] All submitted links work
- [ ] The official submission form has been completed before the deadline

---

# Final Note

There is **no preferred framework, database, programming language, architecture, or technology stack** for this project.

We are evaluating your ability to build software.

You should be able to take:

**Problem → Product → Architecture → Implementation → Testing → Deployment**

and turn it into something another person can actually use.

Do not choose technologies because they sound impressive.

Do not add features simply to make the project look larger.

Choose a problem.

Make sensible engineering decisions.

Build the important workflows properly.

**Ship a complete software product.**
