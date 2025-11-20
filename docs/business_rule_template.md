3.1.4. Business Rules
No. Business Rule Module
Related
Function
Detailed
Description Expected ResultSupporting Technology
1 Strong password Account & Login
Register, Change
Password
Password must be
at least 8
characters
including
uppercase/lowerca
se/number/special
character.
Error/Success
message Regex Validation
2
Lock account after
5 failed logins Account & Login Login
Lock the account
after 5 failed
attempts.
Account is
locked -
3
Periodic password
change Account & Login
Change
Password, Login
Password must be
changed every 90
days.
Notification/Forc
ed change -
4
New password
differs from last 3 Account & Login
Change
Password
New password
must differ from
the last 3.
Error/Success
message Database query
5 Unique username Account & Login Register
Username must be
unique.
Error/Success
message Database validation
6
Valid and unique
email Account & Login Register
Email must be valid
and unique.
Error/Success
message Email/DB validation
7
Only admin
creates staff
accounts Account & Login
User
Management
Only admin can
create staff
accounts.
Access
denied/Success
Role-based access
control
8
Two-factor
authentication Account & Login Login
Two-factor
authentication
required.
Extra auth
request/Login
success 2FA
9
Session login
management Account & Login Login/Logout
Session timeout
control. Auto logout Session management
10
Reader provides
full info Account & Login Register
All required info
must be filled.
Error/Success
message Form validation
11
Personal data
security Account & Login
Register,
View/Edit Info
Personal info is
encrypted.
Data is
protected Data encryption
12
Login/logout
logging Account & Login Login/Logout
Record login/logout
logs. Logs are saved Logging
13
Limit borrowed
books Borrow & Return Borrow books
Max of 5 books can
be borrowed.
Error/Success
message -
14 Loan duration Borrow & Return
Borrow/Extend
books
14 days for regular
books. Textbooks:
4–5 months per
term.
Return date
calculated Date/Time functions
15
Max number of
renewals Borrow & Return Extend books
Max 2 renewals per
book.
Error/Success
message -
16
No renewals for
overdue books Borrow & Return Extend books
Overdue books
can't be renewed. Error message
Date/Time
comparison
17 Overdue fine rate Borrow & Return
Return books,
Fine
management
Fine of 1000
VND/day/book. Fine is calculated Calculation
18
Return all/fine to
borrow again Borrow & Return Borrow books
Must return books
and pay fine before
new borrow.
Error/Success
message Database query
19
Rare books for on-
site read only Borrow & Return Borrow books Read on-site only. Notification -
20
Reference books
not borrowable Borrow & Return Borrow books
Cannot borrow
reference books. Notification -
21
Library card check
before borrowing Borrow & Return Borrow books
Check if card is
valid and active.
Error/Success
message Database query
22
Book condition
check upon return Borrow & Return Return books
Check for
damage/loss.
Status
recorded/Comp
ensation -
23
Compensate for
damaged/lost
books Borrow & Return Return books
Compensation
based on policy.
Compensation
info shown -
24 Book reservation Borrow & Return Reserve books
Readers can
reserve books.
Success/Failure
message -
25
Reservation
pickup deadline Borrow & Return Reserve books
3-day pickup
period. Auto-cancel
if expired.
Reservation
canceled if
overdue Date/Time functions
26
Record
borrow/return
history Borrow & Return
Borrow/Return
books
Save borrowing
history. History is saved Logging
27
Staff handles
online
borrow/return Borrow & Return
Approve online
requests
Staff approves
online requests.
Request is
processed -
28
Book return
reminders Borrow & Return -
Send reminders
before due date. Email/SMS sent Email/SMS
29
Bulk book
borrowing Borrow & Return Borrow books
Lecturers can
borrow multiple
books.
Borrowing limit
adjusted -
30 Unique ISBN
Book
Management Add books
ISBN must be
unique.
Error/Success
message Database validation
31
Complete book
information
Book
Management Add/Edit books
All book info must
be entered.
Error/Success
message Form validation
32
Only staff
add/edit/delete
books
Book
Management
Add/Edit/Delete
books
Only staff can
perform these
actions.
Access
denied/Success
Role-based access
control
33
Check for
duplicate ISBN
Book
Management Add books
Check for duplicate
ISBN.
Error/Success
message Database query
34
Auto-fill via
Barcode/ISBN/OC
R
Book
Management Add books Auto-fill book info.
Info is filled
automatically Barcode/ISBN/OCR
35
Auto-generate QR
Code
Book
Management Add books
QR code is auto-
generated.
QR code is
created QR Code generation
36 Book classification
Book
Management Categorize books
Classify by genre,
topic.
Book is
categorized -
37
Multi-criteria book
search
Book
Management Search books
Search with
multiple criteria.
Book list
returned Database query
38
Manage book
versions
Book
Management Add/Edit books
Manage book
editions.
Edition info
saved -
39
Manage
eBooks/audiobook
s
Book
Management Add/Edit books
Manage digital
files. File is stored File storage
40 Update book Book Update book Update book Status updated -
status Management status status.
41
Print Barcode/QR
Code
Book
Management Print book codes
Print codes for
books. Code is printed
Barcode/QR Code
printing
42 Book data backup
Book
Management Data backup
Periodic data
backups.
Data is backed
up Backup/Restore tools
43
Only staff access
book data
Book
Management -
Only staff can
access data.
Access
denied/Success
Role-based access
control
44
Book
reports/statistics
Book
Management Reporting
Generate book
reports.
Report
generated Reporting tools
45
Import/export
book data
Book
Management
Import/Export
data
Excel file
import/export. Excel file -
46 Log book deletions
Book
Management Delete books Log deleted books.
Deletion history
saved Logging
47
Restore deleted
books
Book
Management Restore books
Restore deleted
books. Book is restored -
48
Manage book
locations
Book
Management -
Manage shelf
location.
Location
updated -
49
Manage book
reviews
Book
Management Book reviews
Manage reader
reviews.
Reviews
saved/deleted -
50
Complete reader
information
Reader
Management Add/Edit reader
All personal info
must be entered.
Error/Success
message Form validation
51
Unique Library
Card Code
Reader
Management Add Reader
The card code must
be unique.
Error/Success
Message Database Validation
52
Only Librarians
Manage Readers
Reader
Management
Add/Edit/Delete
Reader
Only librarians can
perform this action.
Access
Denied/Success
Role-Based Access
Control
53
Check Duplicate
Card Code
Reader
Management Add Reader
Check for duplicate
card code.
Error/Success
Message Database Query
54
Issue/Renew/Lock
Library Card
Reader
Management
Card
Management Change card status.
Card Status
Updated -
55
Log Card Status
Changes
Reader
Management
Card
Management
Log the changes in
card status.
Change History
Saved Logging
56
Protect Reader
Data
Reader
Management
Protect reader
information.
Data is
Protected Data Encryption
57 Search Reader
Reader
Management Search Reader Search by criteria. Reader List Database Query
58
Reader Statistics
Report
Reader
Management Reporting
Generate reader
statistics.
Report
Generated Reporting Tools
59 Classify Readers
Reader
Management Categorize readers.
Reader
Categorized -
60
Borrowing Limit by
Reader Type
Reader
Management Borrow Book
Set borrowing limit
by reader type. Limit Applied -
61 Borrow/Return Reports & Borrow/Return Report on Borrow/Return Reporting Tools
Report Statistics Report borrow/return by
time, category...
Report
62
Book Status
Report
Reports &
Statistics
Book Status
Report
Statistics on books
(available,
borrowed, lost)
Book Status
Report Reporting Tools
63 Reader Report
Reports &
Statistics Reader Report
Statistics on
readers (count,
type...) Reader Report Reporting Tools
64
Export Report in
Multiple Formats
Reports &
Statistics Export Report
Export as PDF,
Excel, CSV... Report File Export Libraries
65
66
Reader Violation
Statistics
Reports &
Statistics
Reader Violation
Reports
Generate reports
on violations by
readers (late
returns, lost books,
etc.)
Reader Violation
Report
Role-based access
control
Custom Time-
based Reports
Reports &
Statistics
Select a date range
for reports.
Time-based
Report Date/Time Functions
67
Popular Books
Report
Reports &
Statistics Book Reports
Report on most
borrowed books. Book List -
68 New Books Report
Reports &
Statistics Book Reports
Report on newly
added books. Book List -
69
Scheduled Data
Backup
System &
Security Backup/Restore
Backup data
daily/weekly. Data Backed Up
Backup/Restore
Tools
70
Access Role
Assignment
System &
Security
User
Management
Assign access by
user role. Access Granted
Role-Based Access
Control
71 Data Encryption
System &
Security Data Storage
Encrypt sensitive
data. Data Encrypted
Encryption
Algorithms
72
Security
Regulation
Compliance
System &
Security Entire System
Ensure compliance
with security
policies. Secure System
Security Best
Practices
73
User Activity
Logging System & Security Log all user actions. Activity Logs Logging Framework
74
Admin-Only
System
Configuration
System &
Security System Settings
Only admin can
configure the
system.
Access
Denied/Success
Role-Based Access
Control
75
Incident
Notification System & Security
Send error
notifications to
admin.
Admin Receives
Notification
Email/SMS
Notification
76
Data Integrity
Check
System &
Security Backup/Restore
Check data after
backup. Result Report Data Integrity Check
77 Data Recovery
System &
Security Backup/Restore
Recover from
backup. Data Restored
Backup/Restore
Tools
78 HTTPS Connection System & System Access Use HTTPS for Secure HTTPS Protocol
Security secure connection. Connection
79
Periodic Security
Audits
System &
Security Security Check
Perform regular
security
vulnerability
checks. Result Report Security Audit Tools
80
Delete User Data
When Account
Deleted
System &
Security Delete Account
Delete all user data
upon account
deletion. Data Deleted -
81
Privacy Law
Compliance System & Security
Comply with
privacy regulations. Data Protected
Data Privacy
Regulations
82
View/Edit
Personal
Information
System &
Security
Account
Management
Users can view/edit
their personal info.
Data
Displayed/Updat
ed -
83
Data Usage Policy
Disclosure System & Security
Publicly disclose
data usage policy. Policy Published -
84
Session
Management
System &
Security Login/Logout
Auto logout after
inactivity. Auto Logout Session Management
85
Related Search
Suggestions
Search &
Discovery Search Books
Suggest related
search terms. List of Keywords GenAI, NLP
86
Search Result
Filtering
Search &
Discovery Search Books
Filter search results
by criteria.
Filtered Book
List Filtering
87
Save Search
History
Search &
Discovery Search Books
Save user search
history.
Search History
Saved -
88 Voice Search
Search &
Discovery Search Books
Use voice for
searching books. Book List Speech-to-Text
89
Advanced Boolean
Search
Search &
Discovery Search Books
Use Boolean
operators for
searching. Search Results Boolean Search
90
Personalized
Search Results
Search &
Discovery Search Books
Search results
personalized to
user preferences. Book List
GenAI,
Recommendation
91
Supported File
Formats Digital Resources Upload Resource
Support PDF, EPUB,
MOBI... formats.
Error/Success
Message File Validation
92
Copyright
Management Digital Resources
Upload/View
Resource
Ensure uploaded
resources are
copyright-
compliant.
Only Valid
Resources
Displayed DRM
93
Limit Access to
Digital Resources Digital Resources View Resource
Restrict access
based on user
groups.
Access
Denied/Success Access Control
94 Access Statistics Digital Resources Reporting
Report on
view/download
counts. Statistics Report -
95 API Authentication Integration & API API
Authenticate API
access.
Access
Denied/Granted API Authentication
96 API Rate Limiting Integration & API API
Limit number of
API requests.
Error/Success
Message Rate Limiting
97
Notifications for
New Books/Events Notification
Send
Notifications
Send email/SMS to
registered readers. Notification Sent Email/SMS
98
Bookmarking in
eBook Reader eBook Reading eBook Reading
Readers can
bookmark and
annotate while
reading.
Bookmark Data
Saved -
99
Customize eBook
Reading Interface eBook Reading eBook Reading
Customize font,
size, background
color...
Interface
Updated -
100
Online Fine
Payment Borrow & Return Pay Fine
Readers can pay
fines online.
Payment
Transaction
Payment Gateway
Integration
101
Return Deadline
Max One Month Borrow & Return Pay Fine
If overdue > 1
month, reader
cannot return
book.
Payment
Transaction -
Table 5 - Business Rules