// src/lib/page-router.js
// Simple page routing system for the multi-page UI flow
// Manages navigation between Sections → Events → Attendance pages

// Application state management
const appState = {
    currentPage: 'sections', // 'sections' | 'events' | 'attendance'
    selectedSections: [],
    selectedSectionData: [],
    selectedEvents: [],
    attendanceData: [],
    attendanceView: 'summary' // 'summary' | 'detailed' | 'campgroups'
};

// Page navigation function
export function showPage(page, options = {}) {
    console.log(`Navigating to page: ${page}`);
    
    // Debug: Check if main container exists
    const mainContainer = document.querySelector('main');
    console.log('Main container found:', !!mainContainer);
    
    // Debug: List all elements with page IDs
    const pages = ['sections-page', 'events-page', 'attendance-page'];
    console.log('Page elements check:', pages.map(pageId => ({
        id: pageId,
        exists: !!document.getElementById(pageId),
        display: document.getElementById(pageId)?.style.display
    })));
    
    // Hide all pages
    pages.forEach(pageId => {
        const element = document.getElementById(pageId);
        if (element) {
            element.style.display = 'none';
        }
    });

    // Show the requested page
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
        targetPage.style.display = 'block';
        appState.currentPage = page;
        
        console.log(`Successfully showed page: ${page}-page`);
        
        // Update page-specific content if needed
        if (options.render && typeof options.render === 'function') {
            options.render();
        }
        
        // Update navigation state
        updateNavigation();
    } else {
        console.error(`Page not found: ${page}-page`);
        // Debug: Show what's actually in the DOM
        console.log('Available elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        console.log('Main container HTML content:', mainContainer?.innerHTML.substring(0, 500));
    }
}

// Update navigation buttons and progress indicators
function updateNavigation() {
    const page = appState.currentPage;
    
    // Update progress indicators if they exist
    const progressElements = document.querySelectorAll('[data-page-progress]');
    progressElements.forEach(element => {
        const targetPage = element.dataset.pageProgress;
        element.classList.toggle('active', targetPage === page);
    });
    
    // Update back buttons
    const backButtons = document.querySelectorAll('[data-back-button]');
    backButtons.forEach(button => {
        button.style.display = page !== 'sections' ? 'inline-block' : 'none';
    });
}

// Navigation functions
export async function goToEvents() {
    if (appState.selectedSections.length === 0) {
        showError('Please select at least one section');
        return;
    }
    
    // Show events page
    showPage('events');
    
    // Initialize events page with data
    if (window.initializeEventsPage) {
        await window.initializeEventsPage();
    }
}

export async function goToAttendance() {
    if (appState.selectedEvents.length === 0) {
        showError('Please select at least one event');
        return;
    }
    
    // Show attendance page
    showPage('attendance');
    
    // Initialize attendance page with data
    if (window.initializeAttendancePage) {
        await window.initializeAttendancePage();
    }
}

export function goBack() {
    switch (appState.currentPage) {
        case 'events':
            showPage('sections');
            break;
        case 'attendance':
            showPage('events');
            break;
        default:
            console.log('Already at first page');
    }
}

// State management functions
export function setSelectedSections(sections, sectionData) {
    appState.selectedSections = sections;
    appState.selectedSectionData = sectionData;
    console.log(`Selected ${sections.length} sections:`, sections);
}

export function setSelectedEvents(events) {
    appState.selectedEvents = events;
    console.log(`Selected ${events.length} events:`, events);
}

export function setAttendanceData(data) {
    appState.attendanceData = data;
    console.log('Attendance data updated');
}

export function setAttendanceView(view) {
    appState.attendanceView = view;
    // Show the specific attendance view
    const attendanceViews = ['summary-view', 'detailed-view', 'campgroups-view'];
    attendanceViews.forEach(viewId => {
        const element = document.getElementById(viewId);
        if (element) {
            element.style.display = viewId === `${view}-view` ? 'block' : 'none';
        }
    });
    
    // Update navigation tabs
    const navTabs = document.querySelectorAll('[data-attendance-tab]');
    navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.attendanceTab === view);
    });
}

// Getters for state
export function getCurrentPage() {
    return appState.currentPage;
}

export function getSelectedSections() {
    return appState.selectedSections;
}

export function getSelectedSectionData() {
    return appState.selectedSectionData;
}

export function getSelectedEvents() {
    return appState.selectedEvents;
}

export function getAttendanceData() {
    return appState.attendanceData;
}

export function getAttendanceView() {
    return appState.attendanceView;
}

// Initialize the page router
export function initializeRouter() {
    console.log('Page router initialized');
    
    // Don't show any page yet - wait for authentication to complete
    // The page will be shown by initializeAppPages() after auth
    
    // Set up global navigation handlers
    window.goToEvents = goToEvents;
    window.goToAttendance = goToAttendance;
    window.goBack = goBack;
    window.setAttendanceView = setAttendanceView;
}

// Import showError function
import { showError } from '../ui.js';