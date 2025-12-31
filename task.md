# Kemal Template Repository

## Project Overview
Create a repository with a Kemal template using https://kemalcr.com/ as the foundation. The application should feature a clean, well-structured UI with modern styling approaches using ECR (Embedded Crystal) templating system.

## Technical Requirements

### 1. CSS Architecture
- Implement TAC (Type, Attribute, Component) CSS approach
  - Reference: [TAC Documentation](./tac.org)
- Separate CSS from components for better maintainability

### 2. ECR Templating System
- Use ECR (Embedded Crystal) for server-side templating
  - Reference: [ECR Documentation](https://crystal-lang.org/api/master/ECR.html)
- Create reusable ECR templates for consistent UI components
- Implement proper template inheritance and partials
- Ensure templates are properly escaped to prevent XSS vulnerabilities

### 3. Component System
- Create a component-based system, using ECR for complex components
- Use https://webawesome.com for custom CSS components
- Develop additional custom CSS components as needed
- Ensure components are modular and reusable

### 4. Design Reference
- Style the application similar to: https://types.kitlangton.com/. The location of elements is also close
- Implement arrangement elements as shown in: [Discord Discussion](./(2) Discord ｜ #help-bugs-problems ｜ Mastra (12_31_2025 3：39：17 PM).html)

### 5. Navigation & Layout
- Implement a left menu with:
  - Filters functionality
  - Search capability
  - Settings panel
- Menu should be opened by clicking the logotype
- Top bar includes a search functionality

### 6. Deployment
- Deploy on Github Pages
- Configure automated builds for ECR templates

## Key Metrics

### Development Metrics
- [ ] Repository created and initialized
- [ ] Kemal application scaffolded
- [ ] TAC CSS architecture implemented
- [ ] ECR templating system configured
- [ ] Component-based system established
- [ ] Left navigation menu completed
- [ ] UI styling completed (similar to reference site)
- [ ] Custom CSS components created
- [ ] Search and filter functionality implemented
- [ ] Settings panel integrated
- [ ] ECR templates properly implemented and tested
- [ ] Template inheritance and partials working correctly

### Quality Metrics
- [ ] Code follows TAC CSS methodology
- [ ] ECR templates are secure and properly escaped
- [ ] Components are reusable and well-documented
- [ ] UI matches reference design standards
- [ ] Navigation is intuitive and responsive
- [ ] All components are properly separated from CSS
- [ ] Templates follow best practices for maintainability

### Performance Metrics
- [ ] Page load time under 3 seconds
- [ ] CSS bundle size optimized
- [ ] Component loading performance acceptable
- [ ] Mobile responsiveness verified
- [ ] Template rendering performance optimized

## Success Criteria
- A fully functional Kemal template repository with ECR templating
- Clean, maintainable codebase following TAC CSS principles
- UI that closely resembles the reference site
- Well-organized component system with separate CSS
- Secure and efficient ECR templating implementation
- Properly configured deployment pipeline