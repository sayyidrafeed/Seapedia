# Guest Flow

Guests are unauthenticated visitors who can browse the public marketplace without logging in.

## What Guests Can Do

| Action | Access |
|--------|--------|
| Browse product catalog | ✅ |
| View product details | ✅ |
| View store information | ✅ |
| Search products | ✅ |
| Submit application reviews | ✅ |
| View application reviews | ✅ |
| Register an account | ✅ |
| Login | ✅ |
| Add to cart | ❌ (requires login) |
| Checkout | ❌ (requires login) |
| Access any dashboard | ❌ (requires login) |
| Manage products | ❌ (requires login) |

## Public Pages

### Landing Page (`/`)

- Hero section with search bar
- Featured/recent products from all stores
- Application review section (testimonials)
- Footer with navigation links

### Product Catalog (`/products`)

- Grid of all products from all stores
- Search functionality
- Product cards show: image, name, price, store name, rating
- Clicking a product navigates to detail page

### Product Detail (`/products/:slug`)

- Product image, name, description, price
- Stock information
- Store information block (store name, rating)
- Product reviews (if any)
- "Add to Cart" button (redirects to login if not authenticated)

### Store Detail (`/stores/:slug`)

- Store name, description, logo
- Store rating and review count
- List of products from this store

### Application Reviews

- Public review section on landing page
- Review form: reviewer name, rating (1-5), comment
- Reviews are displayed in a carousel or list
- No login required to submit

## Guest Navigation

Guests see a simplified navigation bar:

```
[Logo] Home | Products | [Sign In] [Register]
```

- No dashboard links
- No cart icon
- No role switcher
- Clear call-to-action for login/register

## Navigation to Login

When a guest tries to access a protected action (e.g., "Add to Cart"):

1. System checks authentication status
2. Redirects to `/auth/login` with a return URL
3. After login, redirects back to the original page

## Code References

| Component | File |
|-----------|------|
| Landing page | `frontend/src/routes/index.tsx` |
| Product catalog | `frontend/src/features/marketplace/` |
| Product detail | `frontend/src/features/marketplace/` |
| Review form | `frontend/src/features/marketplace/` |
| Public product API | `GET /api/products` |
| Product detail API | `GET /api/products/:slug` |
| Store detail API | `GET /api/stores/:slug` |
| Reviews API | `GET /api/reviews`, `POST /api/reviews` |
