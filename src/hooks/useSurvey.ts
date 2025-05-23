
import { useState, useEffect } from "react";
import { Response, Session } from "@/types";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContext";
import { SurveyDisplayMode, SurveyPage, SurveyTimerConfig, TimerState } from "@/types/survey";
import { useNavigate } from "react-router-dom";
import { collaborationQuestions, deliveryQuestions } from "@/data/surveyQuestions";

// Default timer duration (3 minutes)
const DEFAULT_TIMER_DURATION = 3 * 60;

export const useSurvey = (isParticipant: boolean, session: Session) => {
  const { addParticipant, updateSession } = useSession();
  const navigate = useNavigate();
  
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [additionalItems, setAdditionalItems] = useState<string[]>([""]);
  const [currentPage, setCurrentPage] = useState<SurveyPage>("delivery");
  
  // Display mode functionality
  const [displayMode, setDisplayMode] = useState<SurveyDisplayMode>("grouped");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Timer functionality
  const [timers, setTimers] = useState<TimerState>({
    delivery: { enabled: false, duration: DEFAULT_TIMER_DURATION },
    collaboration: { enabled: false, duration: DEFAULT_TIMER_DURATION },
    additional: { enabled: false, duration: DEFAULT_TIMER_DURATION },
    discussion: { enabled: false, duration: DEFAULT_TIMER_DURATION },
  });

  // Calculate all questions based on the current section
  const getCurrentSectionQuestions = () => {
    switch (currentPage) {
      case "delivery":
        return deliveryQuestions;
      case "collaboration":
        return collaborationQuestions;
      case "additional":
        return []; // Additional section has a different structure
      default:
        return [];
    }
  };
  
  const totalQuestionsInCurrentSection = getCurrentSectionQuestions().length;

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleCommentChange = (questionId: string, value: string) => {
    setComments((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleAdditionalItemChange = (index: number, value: string) => {
    const newItems = [...additionalItems];
    newItems[index] = value;
    setAdditionalItems(newItems);
  };

  const addAdditionalItem = () => {
    setAdditionalItems((prev) => ["", ...prev]);
  };
  
  const handleDisplayModeChange = (mode: SurveyDisplayMode) => {
    setDisplayMode(mode);
    setCurrentQuestionIndex(0); // Reset to first question when changing modes
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestionsInCurrentSection - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      return true;
    }
    return false;
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      return true;
    }
    return false;
  };

  // Timer functions
  const setTimerEnabled = (page: SurveyPage | "discussion", enabled: boolean) => {
    setTimers(prev => ({
      ...prev,
      [page]: {
        ...prev[page as keyof TimerState],
        enabled
      }
    }));
  };

  const setTimerDuration = (page: SurveyPage | "discussion", duration: number) => {
    setTimers(prev => ({
      ...prev,
      [page]: {
        ...prev[page as keyof TimerState],
        duration
      }
    }));
  };

  const setTimerPaused = (page: SurveyPage | "discussion", paused: boolean) => {
    setTimers(prev => ({
      ...prev,
      [page]: {
        ...prev[page as keyof TimerState],
        paused
      }
    }));
  };

  const handleTimerExpire = () => {
    if (displayMode === "one-question") {
      // For one question mode, auto advance to next question
      const movedToNextQuestion = goToNextQuestion();
      if (!movedToNextQuestion) {
        goToNextPage();
      }
      toast.info("Time expired! Moving to next question.");
    } else if (displayMode === "grouped") {
      // For grouped mode, auto advance to next section
      goToNextPage();
      toast.info(`Time expired for ${currentPage} section! Moving to next section.`);
    } else {
      // For all questions mode, mark as submitted
      handleSubmit();
      toast.info("Survey time expired! Submitting current responses.");
    }
  };

  const handleSubmit = () => {
    if (isParticipant) {
      setIsSubmitting(true);

      const participantResponses: Response[] = [
        ...Object.entries(responses).map(([questionId, value]) => ({
          questionId,
          value,
        })),
        ...Object.entries(comments).map(([questionId, value]) => ({
          questionId: `comment_${questionId}`,
          value,
        })),
        ...additionalItems
          .filter((item) => item.trim())
          .map((item, index) => ({
            questionId: `additional_${index}`,
            value: item,
          })),
      ];

      try {
        const participantData = {
          name: session.isAnonymous ? "Anonymous User" : name,
          responses: participantResponses,
        };

        addParticipant(participantData);

        // Update the session with the complete Session object
        updateSession({
          ...session,
          currentPhase: 'discuss'
        });

        setIsSubmitted(true);
        setIsSubmitting(false);
        toast.success("Survey submitted successfully!");
        
        navigate(`/session/${session.id}`);
      } catch (error) {
        console.error("Error submitting survey:", error);
        setIsSubmitting(false);
        toast.error("Failed to submit survey. Please try again.");
      }
    }
  };

  const goToNextPage = () => {
    // In one question mode, try to go to next question first
    if (displayMode === "one-question" && currentPage !== "additional") {
      const movedToNextQuestion = goToNextQuestion();
      if (movedToNextQuestion) return;
    }
    
    // If can't move to next question or not in one-question mode, move to next page
    switch (currentPage) {
      case "delivery":
        setCurrentPage("collaboration");
        setCurrentQuestionIndex(0); // Reset question index when changing sections
        break;
      case "collaboration":
        setCurrentPage("additional");
        setCurrentQuestionIndex(0);
        break;
      case "additional":
        handleSubmit();
        break;
    }
  };

  const goToPrevPage = () => {
    // In one question mode, try to go to previous question first
    if (displayMode === "one-question" && currentPage !== "additional") {
      const movedToPrevQuestion = goToPreviousQuestion();
      if (movedToPrevQuestion) return;
    }
    
    // If can't move to previous question or not in one-question mode, move to previous page
    switch (currentPage) {
      case "collaboration":
        setCurrentPage("delivery");
        // Set to the last question index of the previous section
        setCurrentQuestionIndex(displayMode === "one-question" ? deliveryQuestions.length - 1 : 0);
        break;
      case "additional":
        setCurrentPage("collaboration");
        setCurrentQuestionIndex(displayMode === "one-question" ? collaborationQuestions.length - 1 : 0);
        break;
    }
  };

  return {
    responses,
    comments,
    name,
    setName,
    isSubmitting,
    isSubmitted,
    additionalItems,
    currentPage,
    setCurrentPage,
    handleResponseChange,
    handleCommentChange,
    handleAdditionalItemChange,
    addAdditionalItem,
    handleSubmit,
    goToNextPage,
    goToPrevPage,
    // Display mode properties
    displayMode,
    handleDisplayModeChange,
    currentQuestionIndex,
    getCurrentSectionQuestions,
    // Timer properties
    timers,
    setTimerEnabled,
    setTimerDuration,
    setTimerPaused,
    handleTimerExpire,
  };
};
