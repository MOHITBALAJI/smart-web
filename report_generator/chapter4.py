from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt
from .styles import add_title_paragraph, add_body_p, add_heading_1, add_heading_2, add_heading_3, add_bullet_p, add_styled_table, add_table_caption_below, add_figure_placeholder, add_box_callout

def build_chapter4(doc):
    add_title_paragraph(doc, "CHAPTER 4\nPROPOSED WORK MODULES", size=16, bold=True, space_before=24, space_after=18)
    
    # -------------------------------------------------------------
    # 4.1 OVERVIEW OF PROPOSED SYSTEM
    # -------------------------------------------------------------
    add_heading_1(doc, "4.1 OVERVIEW OF PROPOSED SYSTEM")
    
    add_body_p(doc, "The proposed flood disaster relief portal is engineered as a cohesive, modular web platform designed to streamline humanitarian operations across the entire disaster lifecycle. To achieve high maintainability, fault isolation, and independent scalability, the application architecture is partitioned into four primary operational modules interconnected via reactive state stores and WebSocket pub/sub channels. Figure 4.1 illustrates the modular functional architecture of the platform.")
    
    # Clean Boxed Placeholder for Figure 4.1
    add_figure_placeholder(doc, "4.1", "MODULAR FUNCTIONAL ARCHITECTURE DIAGRAM")
    
    add_body_p(doc, "The four core operational modules are:")
    add_bullet_p(doc, "Responsible for capturing distress signals, satellite GPS coordinates, device health telemetry, and offline cellular SMS fallback payloads.", bold_prefix="1. Emergency SOS & Geolocation Dispatch Module: ")
    add_bullet_p(doc, "Provides real-time spatial visualization, dual-layer vector mapping, dynamic waterway navigation, and a 5-stage mission stepper with dynamic ETA calculations.", bold_prefix="2. Interactive GIS Map & Evacuation Routing Module: ")
    add_bullet_p(doc, "Automates relief shelter occupancy tracking, family unit clustering, priority vulnerable member tagging, commodity inventory ledgers, and digital pass generation.", bold_prefix="3. Relief Camp, Family Tracking & Resource Inventory Module: ")
    add_bullet_p(doc, "Delivers 24/7 conversational medical first-aid guidance, CPR protocols, and helpline dialing powered by Google Gemini AI and Web Speech Recognition.", bold_prefix="4. ReliefAI Assistant & Real-Time Communication Module: ")

    # -------------------------------------------------------------
    # 4.2 EMERGENCY SOS & GEOLOCATION DISPATCH MODULE
    # -------------------------------------------------------------
    add_heading_1(doc, "4.2 EMERGENCY SOS & GEOLOCATION DISPATCH MODULE")
    
    add_body_p(doc, "The Emergency SOS and Geolocation Dispatch Module represents the primary point of contact for stranded disaster victims. Designed specifically for low-friction operation during life-threatening crises, the interface requires zero registration or authentication, enabling victims to transmit critical telemetry within seconds of loading the page. Figure 4.2 illustrates the Emergency SOS dispatch interface.")
    
    # Clean Boxed Placeholder for Figure 4.2
    add_figure_placeholder(doc, "4.2", "INSTANT EMERGENCY SOS DISPATCH INTERFACE")
    
    add_heading_2(doc, "4.2.1 Geolocation Telemetry Ingestion & Accuracy Filtering")
    add_body_p(doc, "Upon accessing the portal, the client automatically requests access to the browser's native HTML5 Geolocation API (navigator.geolocation.getCurrentPosition). The geolocation engine is configured with high-accuracy parameters (enableHighAccuracy: true, timeout: 10000, maximumAge: 0), engaging the device's hardware GNSS/GPS chipset alongside cellular tower triangulation and Wi-Fi SSID trilateration. The acquired telemetry encompasses:")
    
    add_bullet_p(doc, "WGS84 geographic latitude coordinate with precision up to six decimal places (spatial resolution under 0.11 meters).", bold_prefix="Latitude & Longitude: ")
    add_bullet_p(doc, "Horizontal accuracy radius expressed in meters. If accuracy exceeds 100 meters, the system warns the user and performs sequential resampling until precision stabilizes below 15 meters.", bold_prefix="Geospatial Accuracy Radius: ")
    add_bullet_p(doc, "Integrates the Battery Status API (navigator.getBattery) to capture the device's remaining charge percentage. This telemetry allows emergency dispatchers to immediately prioritize victims whose phones are near total power exhaustion.", bold_prefix="Device Battery Level: ")
    
    add_heading_2(doc, "4.2.2 Urgency Classification and Triage Levels")
    add_body_p(doc, "Victims specify their emergency category (Flood Rescue, Medical Emergency, Stranded on Roof, Missing Person, or Structural Collapse) and select an urgency level on a five-tier standardized disaster triage scale:")
    add_bullet_p(doc, "Stable situation; water on street level; evacuation desired but not immediately urgent.", bold_prefix="Level 1 (Low): ")
    add_bullet_p(doc, "Water entering ground floor; power cut; families requiring transport to dry shelters.", bold_prefix="Level 2 (Moderate): ")
    add_bullet_p(doc, "Water depth reaching chest height (3-4 feet); food and potable drinking water exhausted; urgent rescue needed.", bold_prefix="Level 3 (Urgent): ")
    add_bullet_p(doc, "Water submerging ground floor; families forced onto upper balconies; medical vulnerabilities present; life in danger.", bold_prefix="Level 4 (Severe): ")
    add_bullet_p(doc, "Water breaching second floor or terrace; victims clinging to rooftops; critical medical trauma; imminent threat of drowning.", bold_prefix="Level 5 (Critical Emergency): ")
    
    add_heading_2(doc, "4.2.3 Offline Cellular SMS Fallback Payload Generator")
    add_body_p(doc, "Recognizing that extreme storms frequently destroy mobile broadband internet towers (4G/5G) while voice and 2G cellular control channels remain operational, the module incorporates an automated offline fallback engine. When the client detects an offline state (navigator.onLine === false or TCP fetch timeout), it automatically compiles an encoded SMS payload formatted as follows:")
    add_body_p(doc, "EMERGENCY SOS! Name: [Reporter Name], Phone: [Contact], Level: Lvl [1-5], Type: [Category], People: [Count], Location: https://maps.google.com/?q=[Lat],[Lng], Battery: [Percentage]%", bold_prefix="Generated Cellular SMS String: ")
    add_body_p(doc, "The client automatically binds this formatted payload to the system's native SMS protocol handler (sms:112?body=...), allowing the victim to dispatch an exact satellite coordinate distress call via cellular SMS with a single tap.")
    
    sos_schema = [
        ["id", "UUID", "PRIMARY KEY, auto-generated unique distress ticket identifier"],
        ["reporter_name", "VARCHAR(100)", "Full name of reporting citizen or 'Anonymous Survivor'"],
        ["reporter_phone", "VARCHAR(20)", "Cellular contact telephone number for verification"],
        ["latitude", "NUMERIC(10, 7)", "WGS84 decimal latitude coordinate of stranded location"],
        ["longitude", "NUMERIC(10, 7)", "WGS84 decimal longitude coordinate of stranded location"],
        ["address", "TEXT", "Reverse-geocoded physical street location or localized landmark"],
        ["accuracy", "NUMERIC(8, 2)", "Horizontal GPS accuracy confidence circle radius in meters"],
        ["emergency_type", "VARCHAR(50)", "Categorical classification (flood_rescue, medical, stranded, etc.)"],
        ["emergency_level", "INTEGER", "Standardized urgency triage level integer rating from 1 to 5"],
        ["description", "TEXT", "Detailed victim message, trapped family size, and medical needs"],
        ["battery_level", "INTEGER", "Reporting mobile device remaining battery percentage (0 to 100)"],
        ["status", "VARCHAR(30)", "Lifecycle state: 'pending', 'assigned', 'in_progress', 'rescued'"],
        ["created_at", "TIMESTAMPTZ", "Timestamp of initial distress signal broadcast"]
    ]
    # Table rendered FIRST, caption placed AFTER / BELOW the table!
    add_styled_table(doc, ["Column Name", "Data Type", "Schema Constraints & Description"], sos_schema, col_widths=[1.5, 1.4, 3.8])
    add_table_caption_below(doc, "4.1", "Relational Database Schema for Emergency SOS Ingestion (sos_requests)")

    # -------------------------------------------------------------
    # 4.3 INTERACTIVE GIS MAP & EVACUATION ROUTING MODULE
    # -------------------------------------------------------------
    add_heading_1(doc, "4.3 INTERACTIVE GIS MAP & EVACUATION ROUTING MODULE")
    
    add_body_p(doc, "The Interactive GIS Map and Evacuation Routing Module serves as the primary visual command engine for both centralized dispatch controllers and on-ground volunteer rescue boat operators. Built on a dual-layer GIS architecture combining the Google Maps JavaScript API with client-side Leaflet fallback layers, the interface visualizes multi-layer geospatial data on a unified canvas. Figure 4.3 illustrates the live GIS command control map.")
    
    # Clean Boxed Placeholder for Figure 4.3
    add_figure_placeholder(doc, "4.3", "INTERACTIVE LIVE GIS CONTROL MAP & DASHBOARD")
    
    add_heading_2(doc, "4.3.1 Layer Management & Entity Markers")
    add_body_p(doc, "The GIS canvas dynamically renders four distinct geospatial entity layers:")
    add_bullet_p(doc, "Color-coded circular markers displaying pulsating badges. Markers are color-graded based on urgency (Level 5 in bright flashing red, Level 3 in amber). Clicking a pin renders an interactive card showing victim name, trapped headcount, phone number, and a 1-click 'Assign Rescuer' dispatch dialog.", bold_prefix="SOS Distress Pins (Red): ")
    add_bullet_p(doc, "Boat and vehicle markers indicating active rescuer patrols. Includes metadata showing vessel type (Motorized Rescue Boat, Inflatable Zodiac, 4x4 Heavy Truck, Ambulance) and availability status.", bold_prefix="Active Volunteer Rescuers (Blue): ")
    add_bullet_p(doc, "Shelter icons displaying live capacity statistics (e.g., '245/500 Occupied'), generator power availability, clean drinking water tanks, and on-duty medical officers.", bold_prefix="Relief Shelters & Camps (Green): ")
    add_bullet_p(doc, "Semi-transparent polygonal overlays representing active flood hazard zones. Zones are color-coded based on water depth severity (Critical zones with >4m depth in red, High severity in orange, Moderate in yellow).", bold_prefix="Flood Hazard Inundation Polygons (Yellow/Red): ")
    
    add_heading_2(doc, "4.3.2 5-Stage Rescuer Mission Stepper & Live ETA Clock")
    add_body_p(doc, "Once a volunteer rescuer is dispatched to an SOS call, their interface transitions into active navigation mode, rendering a prominent 5-Stage Mission Progress Stepper. Figure 4.4 illustrates the mission stepper and ETA tracking interface.")
    
    # Clean Boxed Placeholder for Figure 4.4
    add_figure_placeholder(doc, "4.4", "5-STAGE RESCUER MISSION PROGRESS STEPPER")
    
    add_body_p(doc, "The mission stepper enforces strict operational accountability across five distinct stages:")
    add_bullet_p(doc, "Rescuer unit notified; motorboat prepped; equipment verified. Progress bar: 20%.", bold_prefix="Stage 1 - Dispatched: ")
    add_bullet_p(doc, "Vessel underway; navigating active waterways toward victim GPS pin. The map plots the forward route polyline in cyan. A live countdown clock (format MM:SS) decrements every second, dynamically estimating arrival time based on calculated water transit speeds (5 km/h for wading, 40 km/h for motorized boats). Progress bar: 40%.", bold_prefix="Stage 2 - En Route: ")
    add_bullet_p(doc, "Rescuer arrives at stranded location; physical contact established; survivors boarded into rescue vessel. Progress bar: 60%.", bold_prefix="Stage 3 - At Victim: ")
    add_bullet_p(doc, "Vessel transporting survivors from flooded sector to designated safe relief camp. The navigation engine automatically re-routes the map trajectory from the victim's location to the destination camp in emerald green. Progress bar: 80%.", bold_prefix="Stage 4 - Evacuating: ")
    add_bullet_p(doc, "Survivors safely disembarked at relief shelter; intake confirmed; mission marked completed in database. Progress bar: 100%.", bold_prefix="Stage 5 - Safe (Completed): ")

    # -------------------------------------------------------------
    # 4.4 RELIEF CAMP & INVENTORY CONTROL MODULE
    # -------------------------------------------------------------
    add_heading_1(doc, "4.4 RELIEF CAMP & INVENTORY CONTROL MODULE")
    
    add_body_p(doc, "Disaster shelters represent the vital refuge where survivors recover and receive humanitarian aid. The Relief Camp, Family Tracking, and Resource Inventory Module transforms chaotic shelter administration into an automated, transparent logistical workflow.")
    
    add_heading_2(doc, "4.4.1 Shelter Occupancy & Capacity Management")
    add_body_p(doc, "Each relief camp record tracks real-time current occupancy against maximum safe capacity. The system automatically computes occupancy ratios:")
    add_body_p(doc, "Occupancy Percentage = (current_occupancy / max_capacity) * 100", bold_prefix="Capacity Formula: ")
    add_body_p(doc, "If occupancy exceeds 90%, the shelter is flagged with an orange warning badge; if occupancy reaches 100%, the shelter is flagged red ('Capacity Full') and automatically excluded from the rescue route finder's recommendation algorithm, preventing dangerous shelter overcrowding.")
    
    camp_schema = [
        ["id", "UUID", "PRIMARY KEY, unique shelter facility identifier"],
        ["name", "VARCHAR(150)", "Official public name of school, community hall, or stadium shelter"],
        ["address", "TEXT", "Complete postal street address and landmark location"],
        ["latitude", "NUMERIC(10, 7)", "WGS84 decimal latitude coordinate of shelter facility"],
        ["longitude", "NUMERIC(10, 7)", "WGS84 decimal longitude coordinate of shelter facility"],
        ["district_id", "UUID", "Foreign key reference to district administrative jurisdiction"],
        ["current_occupancy", "INTEGER", "Real-time count of admitted evacuees currently sheltered"],
        ["max_capacity", "INTEGER", "Maximum authorized bed capacity established by safety guidelines"],
        ["has_medical_officer", "BOOLEAN", "Flag indicating on-duty certified doctor / medical triage team"],
        ["has_generator_power", "BOOLEAN", "Flag indicating operational diesel generator electrical power"],
        ["has_clean_water", "BOOLEAN", "Flag indicating verified purified drinking water tank supply"]
    ]
    # Table rendered FIRST, caption placed AFTER / BELOW the table!
    add_styled_table(doc, ["Column Name", "Data Type", "Schema Constraints & Description"], camp_schema, col_widths=[1.6, 1.4, 3.7])
    add_table_caption_below(doc, "4.2", "Relational Database Schema for Relief Camps Registry (relief_camps)")
    
    add_heading_2(doc, "4.4.2 Family Unit Clustering & Vulnerability Tagging")
    add_body_p(doc, "In the confusion of flood evacuations, family members frequently become separated. The Family Group Management module clusters individual survivors under a common Family Head ID. Each member record tracks age, gender, relationship (Head, Wife, Son, Daughter, Mother, Grandfather, Infant), and specific medical conditions. The system automatically evaluates medical condition strings: any member with conditions such as 'Diabetic - needs insulin', 'Pregnant - 7 months', 'Asthma patient', or 'Wheelchair user' is flagged with a high-priority red badge in the shelter roster. This ensures camp medical officers immediately attend to high-risk individuals upon arrival.")
    
    add_heading_2(doc, "4.4.3 Commodity Inventory Ledger & Shortage Alert Engine")
    add_body_p(doc, "The inventory module manages essential disaster commodities across five critical categories: Food (rice sacks, dal, dry ration packets, baby formula), Water (1L bottles, chlorine tablets), Medical (first-aid kits, paracetamol, ORS hydration sachets, insulin kits), Shelter (tarpaulin sheets, blankets, sleeping mats), and Equipment (flashlights, rescue ropes, life jackets).")
    add_body_p(doc, "For every commodity, the system computes: Current Stock = Total Received - Total Distributed. Whenever Current Stock drops below the predefined Minimum Threshold, the row highlights in red with a pulsating AlertTriangle icon, alerting logistics controllers to dispatch supply trucks before total stockouts occur.")
    
    inv_schema = [
        ["id", "UUID", "PRIMARY KEY, unique commodity stock ledger identifier"],
        ["camp_id", "UUID", "Foreign key linking inventory item to specific relief camp"],
        ["item_name", "VARCHAR(150)", "Descriptive commodity name (e.g., 'Drinking Water Bottles 1L')"],
        ["category", "VARCHAR(50)", "Categorical bucket: 'food', 'water', 'medicine', 'shelter', 'equipment'"],
        ["unit", "VARCHAR(30)", "Standardized measurement unit: 'bottles', 'bags', 'kits', 'sheets'"],
        ["total_received", "INTEGER", "Cumulative units delivered to camp by logistics supply trucks"],
        ["total_distributed", "INTEGER", "Cumulative units distributed to registered evacuee families"],
        ["current_stock", "INTEGER", "Real-time on-hand stock available for distribution in camp"],
        ["min_threshold", "INTEGER", "Critical buffer threshold triggering automated replenishment alerts"]
    ]
    # Table rendered FIRST, caption placed AFTER / BELOW the table!
    add_styled_table(doc, ["Column Name", "Data Type", "Schema Constraints & Description"], inv_schema, col_widths=[1.6, 1.4, 3.7])
    add_table_caption_below(doc, "4.3", "Relational Database Schema for Commodity Inventory Ledger (inventory)")
    
    add_heading_2(doc, "4.4.4 Digital Beneficiary Identity Pass System")
    add_body_p(doc, "To completely eliminate ration hoarding and duplicate supply distribution, the portal incorporates a client-side Digital Beneficiary Identity Pass generator. Utilizing the jsPDF library, the system generates an official PDF credential pass featuring the beneficiary's unique identification code, family member count, assigned shelter name, and authorized ration quota. Camp personnel record distributions against this pass, establishing a transparent audit trail.")

    # -------------------------------------------------------------
    # 4.5 RELIEFAI ASSISTANT & REAL-TIME COMMUNICATION
    # -------------------------------------------------------------
    add_heading_1(doc, "4.5 RELIEFAI ASSISTANT & REAL-TIME COMMUNICATION")
    
    add_body_p(doc, "The ReliefAI Assistant represents the conversational intelligence layer of the portal, providing 24/7 real-time emergency guidance to citizens, rescuers, and camp personnel. Embedded as a persistent floating glassmorphism widget accessible across every page of the application, ReliefAI bridges the gap between anxious survivors and institutional disaster support. Figure 4.8 illustrates the ReliefAI assistant interface.")
    
    # Clean Boxed Placeholder for Figure 4.8
    add_figure_placeholder(doc, "4.8", "RELIEFAI EMERGENCY ASSISTANT FLOATING INTERFACE")
    
    add_heading_2(doc, "4.5.1 Google Gemini AI Model Integration & Prompt Engineering")
    add_body_p(doc, "ReliefAI connects to Google's production-grade Gemini 1.5 and 2.0 Flash Large Language Model REST APIs via HTTPS POST requests. The request payload incorporates a carefully engineered system prompt that grounds the model in humanitarian disaster protocols:")
    add_body_p(doc, "'You are ReliefAI, an expert Realtime Disaster Emergency & First-Aid Assistant for flood relief operations. Provide direct, concise, empathetic, and actionable medical instructions in Markdown formatting. If answering life-critical medical questions (such as drowning or snakebite), follow established clinical triage guidelines.'", bold_prefix="System Grounding Prompt: ")
    
    add_heading_2(doc, "4.5.2 Hands-Free Voice Input via Web Speech Recognition")
    add_body_p(doc, "Recognizing that flood victims may have wet, muddy hands or be holding panicked children, ReliefAI integrates the browser's native Web Speech Recognition API (webkitSpeechRecognition). Tapping a microphone button initiates continuous speech capture, transcribing spoken voice queries directly into text and submitting them to the AI engine without requiring physical keyboard typing.")
    
    add_heading_2(doc, "4.5.3 Rule-Based Conversational Fallback Matrix")
    add_body_p(doc, "To guarantee zero-failure availability during extreme cellular network throttling where external Gemini API handshakes may experience latency, ReliefAI incorporates an intelligent, deterministic local rule-based fallback matrix. Table 4.7 details the primary intent categories and established response protocols:")
    
    intent_data = [
        ["SOS / Danger / Trapped", "Immediate roof evacuation advice; avoid wading; auto-binds 1-click button to /emergency", "🚨 Trigger Emergency SOS Page"],
        ["Drowning & CPR First Aid", "Step-by-step CPR: 30 rapid chest compressions (2 inches deep, 100-120 bpm) + 2 rescue breaths", "🩺 Open First-Aid Guidelines"],
        ["Flood Snakebite First Aid", "Immobilize limb below heart level; DO NOT cut or tourniquet; calm victim; call 108 ambulance", "📞 Emergency Medical Protocol"],
        ["Shelter & Food Rations", "Details active relief camp provisions (meals, potable water, medical beds); links to /facilities", "⛺ View Relief Facilities"],
        ["Helpline Directory", "Lists official telephone hotlines: National 112, NDRF 1078, State 1070, Ambulance 108", "📞 Direct Hotline Dialing"]
    ]
    # Table rendered FIRST, caption placed AFTER / BELOW the table!
    add_styled_table(doc, ["Detected Intent", "Clinical First-Aid / Emergency Advice Rendered", "Bound Interactive Action Button"], intent_data, col_widths=[1.5, 3.7, 1.5])
    add_table_caption_below(doc, "4.7", "ReliefAI Emergency Intent Classifier & Fallback Rules Matrix")

    add_body_p(doc, "By consolidating distress signaling, geospatial routing, shelter logistics, and generative triage assistance into a single unified architecture, Chapter 4 establishes the comprehensive operational capability of the flood response platform.")
