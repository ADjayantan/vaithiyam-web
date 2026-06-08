import SimpleInfoPage from '../../components/SimpleInfoPage';

export default function PrivacyPage() {
  return (
    <SimpleInfoPage title="தனியுரிமை கொள்கை" eyebrow="Policy">
      <p style={{ marginTop: 0 }}>
        கணக்கு, முகவரி, ஆர்டர் போன்ற தகவல்கள் சேவை வழங்கும் நோக்கத்திற்காக மட்டுமே பயன்படுத்தப்படும்.
      </p>
      <p style={{ marginBottom: 0 }}>
        இந்த demo build இல் தரவு in-memory store-ல் உள்ளது. production இல் பாதுகாப்பான தரவுத்தளம், encryption, audit logging தேவை.
      </p>
    </SimpleInfoPage>
  );
}
