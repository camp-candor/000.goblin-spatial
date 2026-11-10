import Model from './99.core/interface/model.interface'

import SpatialUnit from './00.spatial.unit/spatial.unit'
import LocationUnit from './01.location.unit/location.unit'
import CharacterUnit from './02.character.unit/character.unit'
import LawsUnit from './03.laws.unit/laws.unit'
import LogisticUnit from './04.logistic.unit/logistic.unit'
import ClockUnit from './05.clock.unit/clock.unit'
import CooldownUnit from './06.cooldown.unit/cooldown.unit'
import DatabaseUnit from './07.database.unit/database.unit'
import DecayUnit from './08.decay.unit/decay.unit'
import EntityUnit from './09.entity.unit/entity.unit'
import EscalationUnit from './10.escalation.unit/escalation.unit'
import EventsUnit from './11.events.unit/events.unit'
import TopologyUnit from './12.topology.unit/topology.unit'
import SoundUnit from './13.sound.unit/sound.unit'
import PortUnit from './14.port.unit/port.unit'
import OverlayUnit from './15.overlay.unit/overlay.unit'
import OriginUnit from './16.origin.unit/origin.unit'
import ObserverUnit from './17.observer.unit/observer.unit'
import LocomotionUnit from './18.locomotion.unit/locomotion.unit'
import LedgerUnit from './19.ledger.unit/ledger.unit'
import KernelUnit from './20.kernel.unit/kernel.unit'
import LatticeUnit from './21.lattice.unit/lattice.unit'
import IntentUnit from './22.intent.unit/intent.unit'
import IncidentUnit from './23.incident.unit/incident.unit'
import FrontierUnit from './24.frontier.unit/frontier.unit'
import DistanceUnit from './25.distance.unit/distance.unit'
import DestinationUnit from './26.destination.unit/destination.unit'
import CellsUnit from './27.cells.unit/cells.unit'
import AxialUnit from './28.axial.unit/axial.unit'
import TraumaUnit from './37.trauma.unit/trauma.unit'
import TypesUnit from './38.types.unit/types.unit'
import VerbsUnit from './39.verbs.unit/verbs.unit'
import WitnessUnit from './40.witness.unit/witness.unit'
import SegmentUnit from './41.segment.unit/segment.unit'
import ReceiptUnit from './42.receipt.unit/receipt.unit'
import PathUnit from './43.path.unit/path.unit'
import OccupancyUnit from './44.occupancy.unit/occupancy.unit'
import NodeUnit from './45.node.unit/node.unit'
import NeighborUnit from './46.neighbor.unit/neighbor.unit'
import FractionUnit from './47.fraction.unit/fraction.unit'
import FloorUnit from './48.floor.unit/floor.unit'
import EdgeUnit from './49.edge.unit/edge.unit'
import DisplacementUnit from './50.displacement.unit/displacement.unit'
import CapacityUnit from './51.capacity.unit/capacity.unit'
import ModelUnit from './96.model.unit/model.unit'
import CollectUnit from './97.collect.unit/collect.unit'
import MenuUnit from './98.menu.unit/menu.unit'
import BusUnit from './99.bus.unit/bus.unit'

import Spatial from './00.spatial.unit/fce/spatial.interface'
import { SpatialModel } from './00.spatial.unit/spatial.model'
import Location from './01.location.unit/fce/location.interface'
import { LocationModel } from './01.location.unit/location.model'
import Character from './02.character.unit/fce/character.interface'
import { CharacterModel } from './02.character.unit/character.model'
import Laws from './03.laws.unit/fce/laws.interface'
import { LawsModel } from './03.laws.unit/laws.model'
import Logistic from './04.logistic.unit/fce/logistic.interface'
import { LogisticModel } from './04.logistic.unit/logistic.model'
import Clock from './05.clock.unit/fce/clock.interface'
import { ClockModel } from './05.clock.unit/clock.model'
import Cooldown from './06.cooldown.unit/fce/cooldown.interface'
import { CooldownModel } from './06.cooldown.unit/cooldown.model'
import Database from './07.database.unit/fce/database.interface'
import { DatabaseModel } from './07.database.unit/database.model'
import Decay from './08.decay.unit/fce/decay.interface'
import { DecayModel } from './08.decay.unit/decay.model'
import Entity from './09.entity.unit/fce/entity.interface'
import { EntityModel } from './09.entity.unit/entity.model'
import Escalation from './10.escalation.unit/fce/escalation.interface'
import { EscalationModel } from './10.escalation.unit/escalation.model'
import Events from './11.events.unit/fce/events.interface'
import { EventsModel } from './11.events.unit/events.model'
import Topology from './12.topology.unit/fce/topology.interface'
import { TopologyModel } from './12.topology.unit/topology.model'
import Sound from './13.sound.unit/fce/sound.interface'
import { SoundModel } from './13.sound.unit/sound.model'
import Port from './14.port.unit/fce/port.interface'
import { PortModel } from './14.port.unit/port.model'
import Overlay from './15.overlay.unit/fce/overlay.interface'
import { OverlayModel } from './15.overlay.unit/overlay.model'
import Origin from './16.origin.unit/fce/origin.interface'
import { OriginModel } from './16.origin.unit/origin.model'
import Observer from './17.observer.unit/fce/observer.interface'
import { ObserverModel } from './17.observer.unit/val/observer.model'
import Locomotion from './18.locomotion.unit/fce/locomotion.interface'
import { LocomotionModel } from './18.locomotion.unit/locomotion.model'
import Ledger from './19.ledger.unit/fce/ledger.interface'
import { LedgerModel } from './19.ledger.unit/val/ledger.model.js'
import Kernel from './20.kernel.unit/fce/kernel.interface'
import { KernelModel } from './20.kernel.unit/kernel.model'
import Lattice from './21.lattice.unit/fce/lattice.interface'
import { LatticeModel } from './21.lattice.unit/lattice.model'
import Intent from './22.intent.unit/fce/intent.interface'
import { IntentModel } from './22.intent.unit/intent.model'
import Incident from './23.incident.unit/fce/incident.interface'
import { IncidentModel } from './23.incident.unit/incident.model'
import Frontier from './24.frontier.unit/fce/frontier.interface'
import { FrontierModel } from './24.frontier.unit/frontier.model'
import Distance from './25.distance.unit/fce/distance.interface'
import { DistanceModel } from './25.distance.unit/distance.model'
import Destination from './26.destination.unit/fce/destination.interface'
import { DestinationModel } from './26.destination.unit/destination.model'
import Cells from './27.cells.unit/fce/cells.interface'
import { CellsModel } from './27.cells.unit/cells.model'
import Axial from './28.axial.unit/fce/axial.interface'
import { AxialModel } from './28.axial.unit/axial.model'
import Trauma from './37.trauma.unit/fce/trauma.interface'
import { TraumaModel } from './37.trauma.unit/trauma.model'
import Types from './38.types.unit/fce/types.interface'
import { TypesModel } from './38.types.unit/types.model'
import Verbs from './39.verbs.unit/fce/verbs.interface'
import { VerbsModel } from './39.verbs.unit/verbs.model'
import Witness from './40.witness.unit/fce/witness.interface'
import { WitnessModel } from './40.witness.unit/witness.model'
import Segment from './41.segment.unit/fce/segment.interface'
import { SegmentModel } from './41.segment.unit/segment.model'
import Receipt from './42.receipt.unit/fce/receipt.interface'
import { ReceiptModel } from './42.receipt.unit/receipt.model'
import Path from './43.path.unit/fce/path.interface'
import { PathModel } from './43.path.unit/path.model'
import Occupancy from './44.occupancy.unit/fce/occupancy.interface'
import { OccupancyModel } from './44.occupancy.unit/occupancy.model'
import Node from './45.node.unit/fce/node.interface'
import { NodeModel } from './45.node.unit/node.model'
import Neighbor from './46.neighbor.unit/fce/neighbor.interface'
import { NeighborModel } from './46.neighbor.unit/neighbor.model'
import Fraction from './47.fraction.unit/fce/fraction.interface'
import { FractionModel } from './47.fraction.unit/fraction.model'
import Floor from './48.floor.unit/fce/floor.interface'
import { FloorModel } from './48.floor.unit/floor.model'
import Edge from './49.edge.unit/fce/edge.interface'
import { EdgeModel } from './49.edge.unit/edge.model'
import Displacement from './50.displacement.unit/fce/displacement.interface'
import { DisplacementModel } from './50.displacement.unit/displacement.model'
import Capacity from './51.capacity.unit/fce/capacity.interface'
import { CapacityModel } from './51.capacity.unit/capacity.model'
import ModelInterface from './96.model.unit/fce/model.interface'
import { ModelModel } from './96.model.unit/model.model'
import Collect from './97.collect.unit/fce/collect.interface'
import { CollectModel } from './97.collect.unit/collect.model'
import Menu from './98.menu.unit/fce/menu.interface'
import { MenuModel } from './98.menu.unit/menu.model'
import Bus from './99.bus.unit/fce/bus.interface'
import { BusModel } from './99.bus.unit/bus.model'

export const list: Array<any> = [
    SpatialUnit,
    LocationUnit,
    CharacterUnit,
    LawsUnit,
    LogisticUnit,
    ClockUnit,
    CooldownUnit,
    DatabaseUnit,
    DecayUnit,
    EntityUnit,
    EscalationUnit,
    EventsUnit,
    TopologyUnit,
    SoundUnit,
    PortUnit,
    OverlayUnit,
    OriginUnit,
    ObserverUnit,
    LocomotionUnit,
    LedgerUnit,
    KernelUnit,
    LatticeUnit,
    IntentUnit,
    IncidentUnit,
    FrontierUnit,
    DistanceUnit,
    DestinationUnit,
    CellsUnit,
    AxialUnit,
    TraumaUnit,
    TypesUnit,
    VerbsUnit,
    WitnessUnit,
    SegmentUnit,
    ReceiptUnit,
    PathUnit,
    OccupancyUnit,
    NodeUnit,
    NeighborUnit,
    FractionUnit,
    FloorUnit,
    EdgeUnit,
    DisplacementUnit,
    CapacityUnit,
    ModelUnit,
    CollectUnit,
    MenuUnit,
    BusUnit,
]

import * as reduceFromSpatial from './00.spatial.unit/spatial.reduce'
import * as reduceFromLocation from './01.location.unit/location.reduce'
import * as reduceFromCharacter from './02.character.unit/character.reduce'
import * as reduceFromLaws from './03.laws.unit/laws.reduce'
import * as reduceFromLogistic from './04.logistic.unit/logistic.reduce'
import * as reduceFromClock from './05.clock.unit/clock.reduce'
import * as reduceFromCooldown from './06.cooldown.unit/cooldown.reduce'
import * as reduceFromDatabase from './07.database.unit/database.reduce'
import * as reduceFromDecay from './08.decay.unit/decay.reduce'
import * as reduceFromEntity from './09.entity.unit/entity.reduce'
import * as reduceFromEscalation from './10.escalation.unit/escalation.reduce'
import * as reduceFromEvents from './11.events.unit/events.reduce'
import * as reduceFromTopology from './12.topology.unit/topology.reduce'
import * as reduceFromSound from './13.sound.unit/sound.reduce'
import * as reduceFromPort from './14.port.unit/port.reduce'
import * as reduceFromOverlay from './15.overlay.unit/overlay.reduce'
import * as reduceFromOrigin from './16.origin.unit/origin.reduce'
import * as reduceFromObserver from './17.observer.unit/observer.reduce'
import * as reduceFromLocomotion from './18.locomotion.unit/locomotion.reduce'
import * as reduceFromLedger from './19.ledger.unit/ledger.reduce'
import * as reduceFromKernel from './20.kernel.unit/kernel.reduce'
import * as reduceFromLattice from './21.lattice.unit/lattice.reduce'
import * as reduceFromIntent from './22.intent.unit/intent.reduce'
import * as reduceFromIncident from './23.incident.unit/incident.reduce'
import * as reduceFromFrontier from './24.frontier.unit/frontier.reduce'
import * as reduceFromDistance from './25.distance.unit/distance.reduce'
import * as reduceFromDestination from './26.destination.unit/destination.reduce'
import * as reduceFromCells from './27.cells.unit/cells.reduce'
import * as reduceFromAxial from './28.axial.unit/axial.reduce'
import * as reduceFromTrauma from './37.trauma.unit/trauma.reduce'
import * as reduceFromTypes from './38.types.unit/types.reduce'
import * as reduceFromVerbs from './39.verbs.unit/verbs.reduce'
import * as reduceFromWitness from './40.witness.unit/witness.reduce'
import * as reduceFromSegment from './41.segment.unit/segment.reduce'
import * as reduceFromReceipt from './42.receipt.unit/receipt.reduce'
import * as reduceFromPath from './43.path.unit/path.reduce'
import * as reduceFromOccupancy from './44.occupancy.unit/occupancy.reduce'
import * as reduceFromNode from './45.node.unit/node.reduce'
import * as reduceFromNeighbor from './46.neighbor.unit/neighbor.reduce'
import * as reduceFromFraction from './47.fraction.unit/fraction.reduce'
import * as reduceFromFloor from './48.floor.unit/floor.reduce'
import * as reduceFromEdge from './49.edge.unit/edge.reduce'
import * as reduceFromDisplacement from './50.displacement.unit/displacement.reduce'
import * as reduceFromCapacity from './51.capacity.unit/capacity.reduce'
import * as reduceFromModel from './96.model.unit/model.reduce'
import * as reduceFromCollect from './97.collect.unit/collect.reduce'
import * as reduceFromMenu from './98.menu.unit/menu.reduce'
import * as reduceFromBus from './99.bus.unit/bus.reduce'

export const reducer: any = {
    spatial: reduceFromSpatial.reducer,
    location: reduceFromLocation.reducer,
    character: reduceFromCharacter.reducer,
    laws: reduceFromLaws.reducer,
    logistic: reduceFromLogistic.reducer,
    clock: reduceFromClock.reducer,
    cooldown: reduceFromCooldown.reducer,
    database: reduceFromDatabase.reducer,
    decay: reduceFromDecay.reducer,
    entity: reduceFromEntity.reducer,
    escalation: reduceFromEscalation.reducer,
    events: reduceFromEvents.reducer,
    topology: reduceFromTopology.reducer,
    sound: reduceFromSound.reducer,
    port: reduceFromPort.reducer,
    overlay: reduceFromOverlay.reducer,
    origin: reduceFromOrigin.reducer,
    observer: reduceFromObserver.reducer,
    locomotion: reduceFromLocomotion.reducer,
    ledger: reduceFromLedger.reducer,
    kernel: reduceFromKernel.reducer,
    lattice: reduceFromLattice.reducer,
    intent: reduceFromIntent.reducer,
    incident: reduceFromIncident.reducer,
    frontier: reduceFromFrontier.reducer,
    distance: reduceFromDistance.reducer,
    destination: reduceFromDestination.reducer,
    cells: reduceFromCells.reducer,
    axial: reduceFromAxial.reducer,
    trauma: reduceFromTrauma.reducer,
    types: reduceFromTypes.reducer,
    verbs: reduceFromVerbs.reducer,
    witness: reduceFromWitness.reducer,
    segment: reduceFromSegment.reducer,
    receipt: reduceFromReceipt.reducer,
    path: reduceFromPath.reducer,
    occupancy: reduceFromOccupancy.reducer,
    node: reduceFromNode.reducer,
    neighbor: reduceFromNeighbor.reducer,
    fraction: reduceFromFraction.reducer,
    floor: reduceFromFloor.reducer,
    edge: reduceFromEdge.reducer,
    displacement: reduceFromDisplacement.reducer,
    capacity: reduceFromCapacity.reducer,
    model: reduceFromModel.reducer,
    collect: reduceFromCollect.reducer,
    menu: reduceFromMenu.reducer,
    bus: reduceFromBus.reducer,
}

export default class UnitData implements Model {
    idx: string = '001.spatial'
    spatial: Spatial = new SpatialModel()
    location: Location = new LocationModel()
    character: Character = new CharacterModel()
    laws: Laws = new LawsModel()
    logistic: Logistic = new LogisticModel()
    clock: Clock = new ClockModel()
    cooldown: Cooldown = new CooldownModel()
    database: Database = new DatabaseModel()
    decay: Decay = new DecayModel()
    entity: Entity = new EntityModel()
    escalation: Escalation = new EscalationModel()
    events: Events = new EventsModel()
    topology: Topology = new TopologyModel()
    sound: Sound = new SoundModel()
    port: Port = new PortModel()
    overlay: Overlay = new OverlayModel()
    origin: Origin = new OriginModel()
    observer: Observer = new ObserverModel()
    locomotion: Locomotion = new LocomotionModel()
    ledger: Ledger = new LedgerModel()
    kernel: Kernel = new KernelModel()
    lattice: Lattice = new LatticeModel()
    intent: Intent = new IntentModel()
    incident: Incident = new IncidentModel()
    frontier: Frontier = new FrontierModel()
    distance: Distance = new DistanceModel()
    destination: Destination = new DestinationModel()
    cells: Cells = new CellsModel()
    axial: Axial = new AxialModel()
    trauma: Trauma = new TraumaModel()
    types: Types = new TypesModel()
    verbs: Verbs = new VerbsModel()
    witness: Witness = new WitnessModel()
    segment: Segment = new SegmentModel()
    receipt: Receipt = new ReceiptModel()
    path: Path = new PathModel()
    occupancy: Occupancy = new OccupancyModel()
    node: Node = new NodeModel()
    neighbor: Neighbor = new NeighborModel()
    fraction: Fraction = new FractionModel()
    floor: Floor = new FloorModel()
    edge: Edge = new EdgeModel()
    displacement: Displacement = new DisplacementModel()
    capacity: Capacity = new CapacityModel()
    model: ModelInterface = new ModelModel()
    collect: Collect = new CollectModel()
    menu: Menu = new MenuModel()
    bus: Bus = new BusModel()
}
