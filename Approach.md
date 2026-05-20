# EventSpace: Minimal Event Discovery Platform

## System Design & Architecture

### Tech Stack
* **Framework:** React Native + Expo
* **Language:** TypeScript
* **Navigation:** React Navigation (Tabs + Native Stack)
* **Styling:** Custom Design Tokens via StyleSheet

### Data & Network Layer (Service Layer)
All data operations are encapsulated in a mock service layer (`src/services/api.ts`). This layer simulates a real network environment by:
* Adding artificial latency (300ms - 1500ms) to every request.
* Using a unified `ServiceResult<T>` structure to return data or an error string, strictly typed.
* Preventing direct state mutation from UI components by managing an in-memory mutable store (`mockData.ts`).

### Mutation Strategies & UX Decisions

I carefully considered when to use Optimistic vs Pessimistic UI updates based on the critical nature of the operations:

1. **RSVP to Event (PESSIMISTIC):**
   * **Reasoning:** A user's RSVP dictates if they get a spot (Going) or are put on the waitlist. Because this depends on real-time server state (capacity check), we *must* wait for server confirmation before showing them their status. A false "Going" state that rolls back to "Waitlisted" would be a terrible UX.
   * **Implementation:** Button shows a loading spinner, then a toast confirms their status upon success.

2. **Revoke RSVP (PESSIMISTIC):**
   * **Reasoning:** When someone cancels, a complex side-effect occurs: the next person on the waitlist is auto-promoted. We want to ensure this server-side transaction is successful before updating the UI, so we can accurately notify the user if their cancellation triggered a promotion.

3. **Send "Plan Together" Invites (OPTIMISTIC):**
   * **Reasoning:** Sending invites is a high-volume, low-risk action. To keep the app feeling fast and responsive, we immediately process the action, show a success modal/toast, and clear the selected list. If the network fails, we show an error toast. (Note: in this implementation, the modal loading state is briefly shown for UX feedback, but it conceptually supports fire-and-forget).

4. **Respond to Invite (Accept/Reject) (OPTIMISTIC):**
   * **Reasoning:** Accepting or rejecting a personal invite shouldn't have blocking UI. The UI instantly updates the invite card to "Accepted" or "Declined". If the server fails, it seamlessly rolls back to "Pending" and shows an error toast.

### Key Features & Edge Cases Handled

* **Waitlist Auto-Promotion:** When a "Going" user revokes their RSVP, the system automatically pops the first user off the waitlist and moves them to the attendee list. A toast notification is shown to demonstrate this backend side-effect.
* **Loading States:** Implemented full-screen loaders (`LoadingOverlay`), inline button spinners, and skeleton-like behavior on list loads.
* **Empty States:** Custom empty state components for no events, no attendees to invite, and zero pending invites.
* **Error Handling:** Graceful error screens with retry mechanisms.
* **UX/UI Polish:**
  * Clean, dark-mode aesthetic with vibrant accent colors.
  * Status badges on Event cards (Waitlisted, Going, Full).
  * Smooth animations (e.g., a subtle pulse animation on the capacity bar when you RSVP).
  * Multi-select flow for the "Plan Together" feature with a sticky confirmation footer.

### AI & Execution Approach
The codebase was rapidly scaffolded by leveraging AI to generate boilerplate and structural foundations. 
* Initiated the Expo TypeScript blank template.
* Structured the directory into `/src/components`, `/src/screens`, `/src/services`, `/src/theme`, and `/src/types` for maximum scalability.
* Generated mock data to represent a realistic, interconnected graph of Users, Events, Attendees, and Invites.
* Iteratively refined the UI layer, focusing on premium typography, custom components (`PillButton`, `Avatar`, `TagPill`), and fluid navigation flows.
