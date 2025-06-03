DEFINE TABLE rootProject SCHEMAFULL;
DEFINE TABLE childProject SCHEMAFULL;
DEFINE TABLE chunk SCHEMAFUll;
DEFINE TABLE task SCHEMAFULL;

// rootProject columns
DEFINE FIELD name ON rootProject TYPE string;
DEFINE FIELD goal ON rootProject TYPE string;
DEFINE FIELD childProjects ON rootProject TYPE Array<record<childProject>> DEFAULT [];
DEFINE FIELD priority ON rootProject TYPE 'high' | 'medium' | 'low' | 'system';

DEFINE INDEX rootProjectName ON rootProject FIELDS name UNIQUE;

// childProject columns
DEFINE FIELD name ON childProject TYPE string;
DEFINE FIELD goal ON childProject TYPE string;
DEFINE FIELD rootProject ON childProject TYPE record<rootProject>;
DEFINE FIELD tasks ON childProject TYPE Array<record<task>> DEFAULT [];

DEFINE INDEX childProjectName ON childProject FIELDS name UNIQUE;

// chunk columns
DEFINE FIELD interval ON chunk TYPE Array<datetime, 2>;
DEFINE FIELD childProject ON chunk TYPE record<childProject>;
DEFINE FIELD tasks ON chunk TYPE Array<record<task>>;

// task columns
DEFINE FIELD childProject ON task TYPE record<childProject>;
DEFINE FIELD description ON task TYPE string;
DEFINE FIELD is_done ON task TYPE bool;
