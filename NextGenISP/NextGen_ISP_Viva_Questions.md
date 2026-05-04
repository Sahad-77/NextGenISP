# NextGen ISP - Potential Viva / Evaluation Questions

This document contains a curated list of questions that evaluation panels typically ask during final project presentations, along with suggested answers based on the architecture of the NextGen ISP project.

---

## Technical & Architecture Questions

**1. Why did you choose Django for the backend instead of Node.js or Spring Boot?**
*Hint/Answer:* Django provides a highly secure and robust "batteries-included" framework. For an ISP system dealing with complex relational data (Billing, CRM, Inventory, Areas), Django's built-in ORM (Object-Relational Mapping), authentication system, and admin panel allowed for rapid, secure development compared to setting everything up from scratch in Node.js.

**2. How are the backend and frontend communicating?**
*Hint/Answer:* They communicate via a RESTful API. The Django backend exposes API endpoints (using Django REST Framework concepts), and the Vite-React frontend consumes these endpoints using the `axios` HTTP library to fetch and send JSON data. 

**3. Why use Vite instead of Create React App (CRA)?**
*Hint/Answer:* Vite is significantly faster than CRA. It uses ES modules for hot module replacement (HMR), meaning when we make changes to the React code, it updates in the browser instantly without rebuilding the entire bundle. It makes development much more efficient.

**4. How does the system handle Role-Based Access Control (RBAC)?**
*Hint/Answer:* In the database, the custom `User` model extends Django's `AbstractUser` and includes a `Role` field (Admin, Technical Staff, Field Staff, Customer). The backend checks this role before allowing access to specific API endpoints. On the frontend, React Router checks the logged-in user's role and conditionally renders navigational links and protected dashboard routes.

---

## Feature-Specific Questions

**5. How does the Network Mapping feature work technically?**
*Hint/Answer:* We use `leaflet` and `react-leaflet` on the frontend. The backend stores the geographical boundaries of service areas as a string of polygon coordinates (JSON format of latitudes and longitudes) in the `Area` model. The frontend fetches this data and draws the polygons on the interactive map. 

**6. Explain the Customer Onboarding / Installation Workflow.**
*Hint/Answer:* When a lead is verified, the system allows them to pick a plan. Upon selection, an `InstallationTask` object is created in the database. The admin sees this and assigns it to a `Field Staff` and `Technical Staff`. Only when the staff marks the task state as `PHYSICAL_COMPLETED` does the system change the customer's status to `ACTIVE` and start the billing cycle.

**7. How is the Drag-and-Drop Task Board implemented?**
*Hint/Answer:* It is built using the `@hello-pangea/dnd` library on the frontend. When a task is dragged from "Pending" to "In Progress", it updates the local React state immediately for a smooth UI, and simultaneously fires an asynchronous API call to the Django backend to update the task's status in the database.

**8. Explain the relational database structure for Subscriptions and Billing.**
*Hint/Answer:* It uses a heavily relational model. A `User` has many `Subscriptions` (One-to-Many). A `Subscription` is linked to one `Plan` (Foreign Key). An `Invoice` is linked to a `Subscription` and tracks an amount and due date. Finally, a `Payment` is linked to an `Invoice` containing the transaction ID. 

---

## Future Scope & Limitations

**9. What happens if an invoice is unpaid? Does the internet actually stop?**
*Hint/Answer:* Currently, it is a logical management system. The system will flag the invoice as `OVERDUE` and can suspend the account *in the database*, alerting the admin. For the physical internet to stop, the system needs to be integrated with physical ISP routing hardware (like MikroTik routers via RADIUS server), which is marked as the primary "Future Scope" of the project.

**10. Why are you using SQLite as the database? Isn't it meant for light applications?**
*Hint/Answer:* Yes, SQLite is being used currently because it is lightweight, requires zero configuration, and is perfect for local development and the evaluation phase. However, because we use Django's ORM, we can migrate seamlessly to a production-grade database like PostgreSQL simply by changing a few lines in `settings.py` when deploying to a live server.

**11. What is the most challenging part you faced while developing this project?**
*Hint/Answer:* *(Customize this based on your experience!)* A good general answer: "Handling the asynchronous state management on the React frontend when dealing with the Drag-and-Drop interface, ensuring the UI didn't desync from the backend database if a network request failed." Or "Structuring the database relationships so that billing cycles automatically calculate dates correctly based on the `InstallationTask` completion date."

---

## Domain Concepts & Working Logic

**12. What was the central business problem that led to the creation of NextGen ISP?**
*Hint/Answer:* Most local and mid-sized ISPs rely on fragmented systems—using WhatsApp for technician assignments, Excel for billing, and paper ledgers for inventory. This leads to lost revenue, delayed installations, and poor customer service. NextGen ISP acts as a centralized brain, bringing the customer journey, staff workload, and financial tracking under one unified platform.

**13. In your CRM model, why did you strictly separate tickets into `LOGICAL` and `PHYSICAL`?**
*Hint/Answer:* It vastly improves operational efficiency. A `PHYSICAL` ticket (e.g., fiber cut, broken router) requires routing a Field Technician with physical hardware to an exact GPS location. A `LOGICAL` ticket (e.g., slow speeds, payment failure) can be resolved instantly by the Technical Support Admin from the backend console without dispatching a truck.

**14. Explain the "Zone Mapping" or Geofencing feasibility check in your onboarding flow.**
*Hint/Answer:* Instead of letting anyone sign up for an internet connection only to realize later the company can't provide service there, the system uses Geographic Polygons (Areas). The system uses this to verify if incoming leads fall within serviceable bounds, preventing the business from wasting staff time evaluating unserviceable leads.

**15. How does the system handle the transition from a "Lead" to an "Active" billed customer?**
*Hint/Answer:* It follows a strict state-machine logic to ensure fairness. First, the user is a `LEAD`. Once verified by the Admin, they select a Plan/Hardware and an `InstallationTask` is scheduled. Crucially, the billing cycle *does not start* simply because they selected a plan; the invoice and active status are only triggered when the assigned Field Staff marks the physical installation task as `PHYSICAL_COMPLETED`. 

**16. How does your Inventory Management feature link directly into daily ISP operations?**
*Hint/Answer:* When a customer selects a plan, they can add a router. When the Field Staff installs it, they bind the physical "MAC Address" or Serial Number to that specific customer profile. This stops hardware loss, helps the business track exactly where their assets are deployed, and automatically deducts stock levels to trigger low-stock warnings for procurement.

---

## Innovative Ideas & Future Expansions

**17. If you were given 3 more months to work on this, what major business feature would you add?**
*Hint/Answer:* OTT (Over-The-Top) Bundling. Modern ISPs don't just sell raw data; they bundle subscriptions like Netflix, Amazon Prime, or regional streaming apps. I would expand the `Plan` model to allow third-party API hooks to automatically provision OTT streaming accounts when someone buys a premium internet tier.

**18. How could you incorporate AI or Machine Learning into this application?**
*Hint/Answer:* We could build a "Churn Prediction" model. By analyzing customer data—such as high volumes of `LOGICAL` (speed) support tickets, consistently late invoice payments, or dropping daily data usage—an ML model could flag customers who are highly likely to cancel their connection. The admin could then proactively offer them a promotional discount (`PromoCode`) to retain them.

**19. Could this platform be converted into a SaaS (Software as a Service) business model? How?**
*Hint/Answer:* Yes, through "Multi-Tenancy." Right now, it's designed for a single ISP business. By adding a `Company_ID` parameter to every core database table, we could rent this software out. Hundreds of local independent ISPs could independently log in to their own branded, isolated workspaces on our single deployed server.

**20. What is an innovative way to improve the Field Staff workflow in the future?**
*Hint/Answer:* Integrating native mobile hardware technologies. We could wrap the staff portal into a Progressive Web App (PWA) or native app that uses the phone's camera. Instead of field staff typing out complex router MAC addresses and risking typos, they could simply use the camera to scan the barcode on the router box during installation.
