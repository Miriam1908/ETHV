import { motion, AnimatePresence } from 'motion/react';

interface CVPreviewProps {
  cv: any;
  scoreLabel: string;
  t: any;
  scoreColor: (s: number) => string;
  barColor: (s: number) => string;
}

export default function CVPreview({ cv, scoreLabel, t, scoreColor, barColor }: CVPreviewProps) {
  if (!cv) return null;

  const score = cv.ats_score || cv.match_score || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-3 p-4 border-t border-zinc-900"
      >
        {/* Score bar */}
        {score > 0 && (
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">{scoreLabel}</span>
              <span className={`text-2xl font-black ${scoreColor(score)}`}>
                {score}<span className="text-sm text-zinc-600">/100</span>
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <motion.div
                className={`h-2 rounded-full ${barColor(score)}`}
                initial={{ width: 0 }}
                animate={{ width: score + '%' }}
                transition={{ duration: 0.8 }}
              />
            </div>
            {cv.ats_improvements?.length > 0 && (
              <ul className="mt-3 space-y-1">
                {cv.ats_improvements.map((imp: string, i: number) => (
                  <li key={i} className="text-zinc-400 text-xs flex gap-2">
                    <span className="text-emerald-500 flex-shrink-0">✓</span>{imp}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Full ATS CV Document Preview ── */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden" id="cv-preview-print">
          <div className="p-8 max-w-2xl mx-auto font-serif text-gray-900">

            {/* Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-5">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {cv.contact?.name || ''}
              </h1>
              {cv.contact?.title && (
                <p className="text-base text-gray-500 mt-1 italic">{cv.contact.title}</p>
              )}
              <p className="text-xs text-gray-400 mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
                {cv.contact?.email    && <span>{cv.contact.email}</span>}
                {cv.contact?.phone    && <span>· {cv.contact.phone}</span>}
                {cv.contact?.location && <span>· {cv.contact.location}</span>}
                {cv.contact?.linkedin && <span>· {cv.contact.linkedin}</span>}
                {cv.contact?.github   && <span>· {cv.contact.github}</span>}
              </p>
            </div>

            {/* Professional Summary */}
            {cv.professional_summary && (
              <div className="mb-5">
                <SectionHeading>{t.summarySection}</SectionHeading>
                <p className="text-sm text-gray-700 leading-relaxed">{cv.professional_summary}</p>
              </div>
            )}

            {/* Experience */}
            {cv.experience?.length > 0 && (
              <div className="mb-5">
                <SectionHeading>{t.experienceSection}</SectionHeading>
                <div className="space-y-4">
                  {cv.experience.map((exp: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between items-baseline flex-wrap gap-1">
                        <div>
                          <span className="text-sm font-bold text-gray-900">{exp.title}</span>
                          {exp.company && <span className="text-sm text-gray-600"> — {exp.company}</span>}
                        </div>
                        {exp.period && <span className="text-xs text-gray-400 shrink-0">{exp.period}</span>}
                      </div>
                      {exp.location && (
                        <p className="text-xs text-gray-400 italic mt-0.5">{exp.location}</p>
                      )}
                      {exp.achievements?.length > 0 && (
                        <ul className="mt-1.5 space-y-1 ml-3">
                          {exp.achievements.map((a: string, j: number) => (
                            <li key={j} className="text-xs text-gray-700 flex gap-2">
                              <span className="text-gray-400 shrink-0 mt-0.5">▸</span>{a}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {cv.skills && Object.keys(cv.skills).length > 0 && (
              <div className="mb-5">
                <SectionHeading>{t.skillsSection}</SectionHeading>
                <div className="space-y-1.5">
                  {Object.entries(cv.skills).map(([cat, list]: any) =>
                    list?.length > 0 && (
                      <div key={cat} className="flex gap-2 text-xs">
                        <span className="font-semibold text-gray-700 shrink-0 w-28">{cat}:</span>
                        <span className="text-gray-600">{list.join('  ·  ')}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Education */}
            {cv.education?.length > 0 && (
              <div className="mb-5">
                <SectionHeading>{t.educationSection}</SectionHeading>
                <div className="space-y-1.5">
                  {cv.education.map((e: any, i: number) => (
                    <div key={i} className="text-xs">
                      <span className="font-semibold text-gray-800">
                        {typeof e === 'string' ? e : e.degree}
                      </span>
                      {typeof e !== 'string' && e.school && (
                        <span className="text-gray-600"> — {e.school}</span>
                      )}
                      {typeof e !== 'string' && e.year && (
                        <span className="text-gray-400 ml-2">{e.year}</span>
                      )}
                      {typeof e !== 'string' && e.details && (
                        <p className="text-gray-500 italic mt-0.5">{e.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications + Languages */}
            {(cv.certifications?.length > 0 || cv.languages?.length > 0) && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                {cv.certifications?.length > 0 && (
                  <div>
                    <SectionHeading>{t.certificationsSection}</SectionHeading>
                    <ul className="space-y-1">
                      {cv.certifications.map((c: string, i: number) => (
                        <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                          <span className="text-gray-400">▸</span>{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {cv.languages?.length > 0 && (
                  <div>
                    <SectionHeading>{t.languagesSection}</SectionHeading>
                    <ul className="space-y-1">
                      {cv.languages.map((l: string, i: number) => (
                        <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                          <span className="text-gray-400">▸</span>{l}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <p className="text-center text-gray-300 text-xs mt-6 border-t border-gray-100 pt-3">
              Generated by LikeTalent · liketalent.io
            </p>
          </div>
        </div>

        {/* Tips */}
        {cv.tips?.length > 0 && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">💡 {t.aiTips}</p>
            <ul className="space-y-1.5">
              {cv.tips.map((tip: string, i: number) => (
                <li key={i} className="text-zinc-300 text-xs flex gap-2">
                  <span className="text-yellow-400 mt-0.5 flex-shrink-0">→</span>{tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing sections */}
        {cv.missing_sections?.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">⚠ {t.missingSections}</p>
            <ul className="space-y-1">
              {cv.missing_sections.map((s: string, i: number) => (
                <li key={i} className="text-zinc-400 text-xs flex gap-2">
                  <span className="text-red-400 flex-shrink-0">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-1 mb-2">
      {children}
    </h2>
  );
}
