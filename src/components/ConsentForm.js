import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ConsentForm.css";
import { API_BASE_URL, STORAGE_KEYS } from '../constants';
import { useUser } from "../UserContext";

const ConsentForm = () => {
  const [ isAgreed1, setIsAgreed1 ] = useState(false);
  const [ isAgreed2, setIsAgreed2 ] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, setUserId } = useUser();

  useEffect(() => {
    const participantIdFromSessionStorage = sessionStorage.getItem(STORAGE_KEYS.PARTICIPANT_ID);
    const params = new URLSearchParams(location.search);
    const participantIdFromUrl = params.get('participant_id');
    setUserId(participantIdFromUrl || participantIdFromSessionStorage || '');
  }, [ location, setUserId ]);

  const handleAgree = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: userId || undefined,
          consent: Boolean(isAgreed1 && isAgreed2),
        }),
      }).then((res) => res.json());

      if (!res.participantId) {
        throw new Error('Could not determine the participant ID');
      }

      setUserId(res.participantId);

      sessionStorage.setItem(STORAGE_KEYS.PARTICIPANT_ID, res.participantId);

      // return navigate('/userinfo');

      // Navigate to the main page
      // Get user demographics from prolific or the post survey
      return navigate('/memes');
    } catch(err) {
      alert(`Participant ID is missing or invalid.\n${err}`);
    }
  };

  const handleCheckboxChange = (checkBoxIndex) => (e) => {
    [ setIsAgreed1, setIsAgreed2 ][checkBoxIndex](e.target.checked);
  };

  return (
    <div className="consent-form card">
      <h2>Informed Consent of Participation</h2>
      <p>You are invited to participate in the online study LLMeme, initiated and conducted by Florian Müller. The research is supervised by Zhikun Wu, Thomas Weber, and Florian Müller at LMU Munich. Please note:</p>

      <p>Your participation is voluntary.</p>
      <p>The online study will last approximately 30 minutes.</p>
      <p>We will record personal demographics (age, gender, etc.) as well as your subjective perception of the system.</p>
      <p>We may publish our results from this and other sessions, but all such reports will be confidential and will neither include your name nor cannot be associated with your identity.</p>
      <p>If you have any questions about the whole informed consent process of this research or your rights as a human research subject, please contact Florian Müller (E-Mail: f_m@outlook.com). You should carefully read the settings below. (You may take as much time as you need to read the consent form.)</p>

      <ol>
        <li>
          <strong>Purpose and Goal of this Research</strong>
          <p>Explore the benefit of LLMs for creative tasks Explore the benefit of LLMs for creative tasks Your participation will help us achieve this goal. The results of this research may be presented at scientific or professional meetings or published in scientific proceedings and journals.</p>
        </li>

        <li>
          <strong>Participation and Compensation</strong>
          <p>Your participation in this online study is voluntary. You will be one of approximately 200 people being surveyed for this research. You will receive 10 USD/h as compensation for your participation. You may withdraw and discontinue participation at any time without penalty or losing the compensation. If you decline to participate or withdraw from the online study, this will be confidential. If possible, you may refuse to answer any questions you do not want to answer or withdraw from participation at any time.</p>
          <p>At any time and without giving any reason, you can notify us that you want to withdraw the consent given (GDPR Art. 21). In case of withdrawal, your data stored based on your consent will be deleted or anonymized where this is legally permissible (GDPR Art. 17). If deletion is impossible or only possible with unreasonable technical effort, your data will be anonymized by deleting the personal identification information. However, anonymization of your data cannot entirely exclude the possibility of subsequent tracing of information to you via other sources. Finally, once the data is anonymized, the deletion of the data is not possible anymore as we will not be able to identify which data is yours.</p>
        </li>

        <li>
          <strong>Procedure</strong>
          <p>After giving consent, you will be guided through the following steps:</p>
          <ol>
            <li>Participants generate a set of Memes</li>
            <li>Participants provide feedback about the process</li>
          </ol>
          <p>The complete procedure of this online study will last approximately 30 minutes.</p>
        </li>

        <li>
          <strong>Risks and Benefits</strong>
          <p>There are no risks associated with this online study. Discomforts or inconveniences will be minor and are unlikely to happen. If you feel uncomfortable, you may discontinue your participation. Your benefit in participating is your compensation described above. With this research, we will advance knowledge in this research field.</p>
        </li>

        <li>
          <strong>Data Protection and Confidentiality</strong>
          <p>The General Data Protection Regulation (GDPR) of the European Union (EU) governs that data collection process. The legal basis for processing the personal data is the consent in accordance with GDPR Art. 6 (1). The GDPR agreneets a set of right to the data subjects, including the right to access, rectification, and erasure of personal data.</p>

          <ul>
            <li>You have the right to access your personal data at any time (GDPR Art. 15).</li>
            <li>You have the right to correct inaccurate personal data at any time (GDPR Art. 16).</li>
            <li>You have the right to have your personal data deleted (GDPR Art. 17).</li>
            <li>You have the right to limit the processing of your personal data (GDPR Art. 18).</li>
            <li>You have the right to have your data transforared to others (GDPR Art. 20).</li>
            <li>You have the right to withdraw the consent given (GDPR Art. 21).</li>
            <li>If you wish to exercise any of your rights, please contact the researchers.</li>
          </ul>

          <p>Personal data (age, gender, experience with creative tasks) will be recorded during participation. The contact details of the study participants can be used to track potential infection chains. Researchers will not identify you by your real name in any reports using settings obtained from this online study, and your confidentiality as a participant in this online study will remain secure. Data collected in this online study will be treated in compliance with the GDPR.</p>
          <p>We will record demographics and browser meta data during the online study. All data you provide in this online study will be published anonymized. Subsequent uses of records and data will be subject to standard data use policies that protect the participating individuals' anonymity. We will remove or code any personal information that could identify you before publishing the data to ensure that no one can identify you from the information we share. We will use current scientific standards and known methods for anonymization. When your data are anonymized, they are altered in a manner that they can no longer be traced back to your person or only with disproportionate technical effort. Despite these measures, we cannot guarantee the anonymity of your personal data. This site uses cookies and other tracking technologies to conduct the research, to improve the user experience, the ability to interact with the system and to provide additional content from third parties. Despite careful control of content, the researchers assume no liability for damages, which directly or indirectly result from the use of this online application.</p>
          <p>Your non-anonymized data will be stored for six months from the time your consent is given, unless you withdraw your consent before this period has elapsed. Your non-anonymized data will be stored in a secure location and will be accessible only to the researchers involved in this work.</p>
          <p>Anonymized data collected can be shared publicly. Data collected that have not been made public will be deleted after the end of the research.</p>
          <p>As with any publication or online-related activity, the risk of a breach of confidentiality is always possible. According to the GDPR, the researchers will inform the participant if a breach of confidential data is detected.</p>

        </li>
        <li>
          <strong>Identification of Investigators</strong>
          <p>If you have any questions or concerns about the research, please feel free to contact:</p>
        </li>
      </ol>

      <div className="flex-row">
        <p>
          Florian Müller<br/>
          Principal Investigator<br/>
          florian.mueller4@tu-darmstadt.de
        </p>
        <p>
          Thomas Weber<br/>
          thomas.weber@ifi.lmu.de
        </p>
      </div>

      <p>Thank you for participating in our experimental study. Before you proceed, please read the following consent form.</p>
      <p>
        Participation in this experiment is completely voluntary, and you can withdraw at any time. We ensure your privacy, and all your data will be kept confidential and used solely for the purpose of this study.
      </p>

      <h3>Informed Consent and Agreement</h3>

      <p>This consent form will be retained securely and in compliance with the GDPR for no longer than necessary.</p>

      <p>
        <label>
          <input type="checkbox" checked={isAgreed1} onChange={handleCheckboxChange(0)} />
          I understand the explanation provided to me. I have been given access to a copy of this form or had the opportunity to create a copy for myself. I have had all my questions answered to my satisfaction, and I voluntarily agree to participate in this online study.
        </label>
      </p>
      <p>
        <label>
          <input type="checkbox" checked={isAgreed2} onChange={handleCheckboxChange(1)} />
          I voluntarily consent to my data being recorded and subsequently processed in line with the GDPR. I have been informed about the consequences of withdrawing my consent.
        </label>

      </p>
      <button className="btn" onClick={handleAgree} disabled={!isAgreed1 || !isAgreed2}>Agree and Continue</button>
    </div>
  );
};

export default ConsentForm;
