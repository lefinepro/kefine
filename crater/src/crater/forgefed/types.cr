require "json"
require "../aptok"

module Lepos
  module ForgeFed
    CONTEXT = Aptok::FORGEFED_CONTEXT

    alias Project = Aptok::Vocab::Project
    alias Ticket = Aptok::Vocab::Ticket
    alias Repository = Aptok::Vocab::Repository
    alias Branch = Aptok::Vocab::Branch
    alias PatchTracker = Aptok::Vocab::PatchTracker
  end
end
