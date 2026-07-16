---

# Proyecto: Visual Logic Editor (Node Graph)

````markdown
# 🕸️ Visual Logic Node Editor

An enterprise-grade visual programming interface built on top of Directed Acyclic Graphs (DAG). This application allows users to construct complex mathematical logic visually by connecting draggable nodes, mimicking the architecture of top-tier SaaS automation tools.

## 🚀 Impact & Business Value

Visual builders reduce the learning curve for complex software. By translating abstract mathematical operations into a tactile, node-based UI, this project demonstrates the ability to build intuitive tools for non-technical end-users in a B2B or SaaS environment.

## 🧠 Architectural Highlights

- **DAG Evaluation Engine:** Uses React's Context API to create a top-down evaluation tree. Data flows through the graph structure, updating downstream nodes at 60fps without blocking the main thread.
- **Dynamic Instantiation:** Drag-and-drop system to spawn infinite node instances with unique identifiers, seamlessly integrating them into the global calculation context.
- **Custom Data-Carrying Edges:** Bezier curve connections that aren't just visual; they act as data conduits, displaying the exact floating-point value traveling between nodes.
- **Floating-Point Precision:** Robust handling of decimal mathematics and edge cases (e.g., division by zero) across the entire node ecosystem.

## 🛠 Tech Stack

- **Framework:** Next.js 14
- **Core Library:** @xyflow/react (React Flow)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Package Manager:** Bun

## 💻 Quick Start

Clone the repository and initialize the project:

```bash
bun install
bun run dev
```
````
