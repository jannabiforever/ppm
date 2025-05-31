DEFINE TABLE root_project SCHEMAFULL;
DEFINE TABLE child_project SCHEMAFULL;
DEFINE TABLE chunk SCHEMAFUll;
DEFINE TABLE task SCHEMAFULL;

// root_project columns
DEFINE FIELD name ON root_project TYPE string;
DEFINE FIELD goal ON root_project TYPE string;
DEFINE FIELD child_projects ON root_project TYPE record<child_project>;
DEFINE FIELD priority ON root_project TYPE 'high' | 'medium' | 'low';

// child_project columns
DEFINE FIELD name ON child_project TYPE string;
DEFINE FIELD goal ON child_project TYPE string;
DEFINE FIELD root_project ON child_project TYPE record<root_project>;
DEFINE FIELD tasks ON child_project TYPE Array<record<task>>;

// chunk columns
DEFINE FIELD interval ON chunk TYPE Array<datetime, 2>;
DEFINE FIELD child_project ON chunk TYPE record<child_project>;
DEFINE FIELD tasks ON chunk TYPE Array<record<task>>;

// task columns
DEFINE FIELD child_project ON task TYPE record<child_project>;
DEFINE FIELD description ON task TYPE string;
DEFINE FIELD is_done ON task TYPE bool;
