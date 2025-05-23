
import { Session } from "@/types";
import { ActionsList } from "./review/ActionsList";
import { TeamAgreementList } from "./review/TeamAgreementList";
import { ParkingLotList } from "./review/ParkingLotList";
import { ParticipantsList } from "./review/ParticipantsList";

export default function ReviewPhase({ session, isParticipant = false }: { session: Session; isParticipant?: boolean }) {
  return (
    <div className="container mx-auto max-w-[1200px] py-6 space-y-6">
      {/* Session Summary Card */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Session Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Session Name</p>
            <p className="font-medium">{session.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date Created</p>
            <p className="font-medium">
              {new Date(session.dateCreated).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              <p className="font-medium capitalize">{session.status}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Participants</p>
            <p className="font-medium">5 team members</p>
          </div>
        </div>
      </div>

      {/* Review Sections - Stacked vertically */}
      <div className="space-y-6">
        <div className="w-full">
          <ActionsList />
        </div>
        <div className="w-full">
          <TeamAgreementList />
        </div>
        <div className="w-full">
          <ParkingLotList />
        </div>
      </div>
    </div>
  );
}
