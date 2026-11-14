import Incident from './fce/incident.interface.js'

export class IncidentModel implements Incident {
    lastIncidentReport: unknown = null
    incidentReceiptCount: number = 0
}
